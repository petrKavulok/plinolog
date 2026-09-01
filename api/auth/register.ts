import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionCookie, findUserByUsername } from "../_lib/auth.js";
import { db, schema } from "../_lib/db.js";
import { fail, json, newId, parseBody, route } from "../_lib/http.js";

const Body = z.object({
  username: z.string().trim().min(2, "Jméno musí mít aspoň 2 znaky."),
  displayName: z.string().trim().min(1).max(40),
  password: z.string().min(8, "Heslo musí mít aspoň 8 znaků."),
  inviteCode: z.string(),
});

export default route({
  POST: async (req) => {
  const body = await parseBody(req, Body);

  // Bez zvacího kódu se nikdo cizí nezaregistruje (appka je jen pro nás dva).
  const expected = process.env.INVITE_CODE;
  if (!expected) fail(500, "Registrace není nastavená (chybí INVITE_CODE).");
  if (body.inviteCode.trim() !== expected) fail(403, "Neplatný zvací kód.");

  const username = body.username.toLowerCase();
  if (await findUserByUsername(username)) fail(409, "Tohle jméno už někdo má.");

  const user = {
    id: newId(),
    username,
    displayName: body.displayName,
    passwordHash: await bcrypt.hash(body.password, 10),
    createdAt: Date.now(),
  };
  await db().insert(schema.users).values(user);

  const session = { id: user.id, username: user.username, displayName: user.displayName };
  return json(
    { user: session },
    { status: 201, headers: { "set-cookie": await createSessionCookie(session) } },
  );
},
});
