import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, ViteDevServer } from "vite";

/**
 * V produkci soubory v `api/` obsluhuje Vercel jako funkce s Node signaturou
 * `(req, res)`. Tenhle plugin dělá totéž v `vite dev`, takže stačí
 * `npm run dev` a nemusí běžet `vercel dev`.
 */
export function apiDev(): Plugin {
  return {
    name: "plinolog-api-dev",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api", async (req, res, next) => {
        const file = findHandlerFile(new URL(req.url ?? "/", "http://localhost").pathname);
        if (!file) return next();

        try {
          const mod = (await server.ssrLoadModule(file)) as {
            default?: (req: unknown, res: unknown) => Promise<void>;
          };
          if (typeof mod.default !== "function") {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: `${file} nemá default export.` }));
            return;
          }
          await mod.default(req, res);
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          console.error(err);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String((err as Error).message ?? err) }));
        }
      });
    },
  };
}

function findHandlerFile(pathname: string): string | null {
  // middleware je připojený na /api, takže prefix už je odříznutý
  const clean = pathname.replace(/^\/api/, "").replace(/^\//, "").replace(/\/$/, "");
  if (clean.includes("..")) return null;
  for (const candidate of [`api/${clean}.ts`, `api/${clean}/index.ts`]) {
    const abs = resolve(process.cwd(), candidate);
    if (existsSync(abs)) return abs;
  }
  return null;
}
