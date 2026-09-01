import { getUser } from "../_lib/auth";
import { json, route } from "../_lib/http";

export const GET = route(async (req) => json({ user: await getUser(req) }));
