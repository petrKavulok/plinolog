import { clearSessionCookie } from "../_lib/auth";
import { json, route } from "../_lib/http";

export default route({
  POST: async () =>
    json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } }),
});
