import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Connect, Plugin, ViteDevServer } from "vite";

/**
 * V produkci soubory v `api/` obsluhuje Vercel jako funkce (Web handlery
 * `export const GET/POST/...`). Tenhle plugin dělá totéž v `vite dev`,
 * takže stačí `npm run dev` a nemusí běžet `vercel dev`.
 */
export function apiDev(): Plugin {
  return {
    name: "plinolog-api-dev",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api", async (req, res, next) => {
        const handled = await handle(server, req, res);
        if (!handled) next();
      });
    },
  };
}

async function handle(
  server: ViteDevServer,
  req: Connect.IncomingMessage,
  res: import("node:http").ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const file = findHandlerFile(url.pathname);
  if (!file) return false;

  try {
    const mod = (await server.ssrLoadModule(file)) as Record<string, unknown>;
    const handler = mod[req.method ?? "GET"] ?? mod.default;
    if (typeof handler !== "function") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: `Metoda ${req.method} tady není.` }));
      return true;
    }

    const response: Response = await handler(await toRequest(req, url));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    server.ssrFixStacktrace(err as Error);
    console.error(err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: String((err as Error).message ?? err) }));
  }
  return true;
}

function findHandlerFile(pathname: string): string | null {
  // pathname už je bez /api prefixu (middleware ho ořízne), ale pro jistotu:
  const clean = pathname.replace(/^\/api/, "").replace(/^\//, "").replace(/\/$/, "");
  if (clean.includes("..")) return null;
  for (const candidate of [`api/${clean}.ts`, `api/${clean}/index.ts`]) {
    const abs = resolve(process.cwd(), candidate);
    if (existsSync(abs)) return abs;
  }
  return null;
}

async function toRequest(req: Connect.IncomingMessage, url: URL): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value) headers.set(key, value);
  }

  const method = req.method ?? "GET";
  let body: Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    body = Buffer.concat(chunks);
  }

  return new Request(`http://localhost${url.pathname}${url.search}`, {
    method,
    headers,
    body: body?.length ? body : undefined,
  });
}
