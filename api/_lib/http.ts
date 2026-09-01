import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError, type ZodType } from "zod";

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

/** Chyba, kterou je bezpečné poslat uživateli. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}

type Handler = (req: Request) => Response | Promise<Response>;
type NodeHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

/**
 * Poskládá z metod jeden handler a vyexportuje se jako `export default`.
 *
 * Handlery píšeme proti Web API (`Request` → `Response`), ale ven vydáváme
 * klasickou Node signaturu `(req, res)`. Tu @vercel/node u samostatných
 * souborů v `api/` podporuje spolehlivě; pojmenované exporty metod
 * (`export const GET`) jsou konvence Next.js App Routeru a tady vedou
 * na FUNCTION_INVOCATION_FAILED.
 */
export function route(methods: Partial<Record<string, Handler>>): NodeHandler {
  return async (req, res) => {
    let response: Response;
    try {
      const handler = methods[req.method ?? "GET"];
      response = handler
        ? await handler(await toRequest(req))
        : json({ error: `Metoda ${req.method} tady není.` }, { status: 405 });
    } catch (err) {
      response = toErrorResponse(err);
    }

    res.statusCode = response.status;
    // set-cookie může být vícekrát, proto zvlášť
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) res.setHeader("set-cookie", cookies);
    response.headers.forEach((value, key) => {
      if (key !== "set-cookie") res.setHeader(key, value);
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  };
}

function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return json({ error: "Neplatná data.", issues: err.issues }, { status: 400 });
  }
  console.error(err);
  return json({ error: "Něco se pokazilo na serveru." }, { status: 500 });
}

async function toRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value) headers.set(key, value);
  }

  const method = req.method ?? "GET";
  let body: Buffer | string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    // Vercel tělo někdy naparsuje dopředu do req.body — stream by pak byl prázdný.
    const parsed = (req as IncomingMessage & { body?: unknown }).body;
    if (parsed === undefined || parsed === null) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      body = Buffer.concat(chunks);
    } else if (typeof parsed === "string" || Buffer.isBuffer(parsed)) {
      body = parsed as Buffer | string;
    } else {
      body = JSON.stringify(parsed);
    }
  }

  // Buffer → Uint8Array, aby seděl typ BodyInit
  const init: RequestInit = { method, headers };
  if (body?.length) init.body = typeof body === "string" ? body : new Uint8Array(body);
  return new Request(url, init);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    fail(400, "Očekával jsem JSON.");
  }
  return schema.parse(raw);
}

/** Id předáváme v query (`?id=…`), ne dynamickou routou. */
export function idFromUrl(req: Request): string {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) fail(400, "Chybí id.");
  return id;
}

export function newId() {
  return crypto.randomUUID();
}
