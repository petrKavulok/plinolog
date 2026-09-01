import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionCookie, findUserByUsername } from "../_lib/auth";
import { fail, json, parseBody, route } from "../_lib/http";

const Body = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const POST = route(async (req) => {
  const { username, password } = await parseBody(req, Body);
  const user = await findUserByUsername(username);

  // Hash počítáme i pro neexistujícího uživatele, ať se z délky odpovědi
  // nedá poznat, jestli jméno existuje.
  const hash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) fail(401, "Špatné jméno nebo heslo.");

  const session = { id: user.id, username: user.username, displayName: user.displayName };
  return json(
    { user: session },
    { headers: { "set-cookie": await createSessionCookie(session) } },
  );
});
