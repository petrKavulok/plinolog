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

/** Obalí handler — vrátí čitelnou JSON chybu místo 500 bez kontextu. */
export function route(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return json({ error: "Neplatná data.", issues: err.issues }, { status: 400 });
      }
      console.error(err);
      return json({ error: "Něco se pokazilo na serveru." }, { status: 500 });
    }
  };
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

/** Poslední segment cesty — používáme místo dynamických [id] rout. */
export function idFromUrl(req: Request): string {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) fail(400, "Chybí id.");
  return id;
}

export function newId() {
  return crypto.randomUUID();
}
