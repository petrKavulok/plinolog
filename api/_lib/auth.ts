import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { db, schema } from "./db";
import { fail } from "./http";

const COOKIE = "plinolog_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 dní — rodič se nemá v noci přihlašovat

function secret() {
  const value = process.env.AUTH_SECRET;
  // fail() místo throw — projde přes route() jako čitelná JSON chyba.
  if (!value) fail(500, "Na serveru chybí AUTH_SECRET — doplň ji ve Vercel a nasaď znovu.");
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: string; username: string; displayName: string };

export async function createSessionCookie(user: SessionUser) {
  const token = await new SignJWT({ username: user.username, displayName: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function readCookie(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return null;
}

/** Vrátí přihlášeného uživatele, nebo null. */
export async function getUser(req: Request): Promise<SessionUser | null> {
  const token = readCookie(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      username: String(payload.username ?? ""),
      displayName: String(payload.displayName ?? ""),
    };
  } catch {
    return null;
  }
}

/** Jako getUser, ale nepřihlášenému rovnou vrátí 401. */
export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await getUser(req);
  if (!user) fail(401, "Nejsi přihlášený.");
  return user;
}

export async function findUserByUsername(username: string) {
  const [row] = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}
