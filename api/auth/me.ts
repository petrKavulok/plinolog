import { getUser } from "../_lib/auth";
import { json, route } from "../_lib/http";

export default route({
  GET: async (req) => json({ user: await getUser(req) }),
});
