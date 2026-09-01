import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { fail } from "./http";
import * as schema from "./schema";

type Db = ReturnType<typeof create>;
let cached: Db | null = null;

function create(url: string) {
  return drizzle(neon(url), { schema });
}

/**
 * Připojení se vytváří až při prvním dotazu, ne při importu modulu.
 * Kdyby to bylo na úrovni modulu, chybějící DATABASE_URL shodí celou funkci
 * a Vercel vrátí HTML FUNCTION_INVOCATION_FAILED místo srozumitelné chyby.
 */
export function db(): Db {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) fail(500, "Na serveru chybí DATABASE_URL — doplň ji ve Vercel → Settings → Environment Variables a nasaď znovu.");
    cached = create(url);
  }
  return cached;
}

export { schema };
