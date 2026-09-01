import { clearSessionCookie } from "../_lib/auth";
import { json, route } from "../_lib/http";

export const POST = route(async () =>
  json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } }),
);
