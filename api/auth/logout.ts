import { clearSessionCookie } from "../_lib/auth.js";
import { json, route } from "../_lib/http.js";

export default route({
  POST: async () =>
    json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } }),
});
