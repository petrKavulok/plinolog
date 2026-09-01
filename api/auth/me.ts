import { getUser } from "../_lib/auth.js";
import { json, route } from "../_lib/http.js";

export default route({
  GET: async (req) => json({ user: await getUser(req) }),
});
