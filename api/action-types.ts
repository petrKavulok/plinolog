import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "./_lib/auth.js";
import { db, schema } from "./_lib/db.js";
import { fail, idFromUrl, json, newId, parseBody, route } from "./_lib/http.js";

const { actionTypes } = schema;

const Input = z.object({
  label: z.string().trim().min(1, "Napiš název akce.").max(40),
  emoji: z.string().trim().min(1).max(8),
  kind: z.enum(["event", "quantity"]),
  unit: z.string().trim().max(12).nullable().default(null),
  presets: z.array(z.number().nonnegative()).max(6).default([]),
  defaultValue: z.number().nonnegative().nullable().default(null),
  goalPeriod: z.enum(["none", "day", "week"]),
  goalValue: z.number().nonnegative().nullable().default(null),
  weighing: z.boolean().default(false),
  impliesActionId: z.string().nullable().default(null),
  sortOrder: z.number().int().default(0),
  archived: z.boolean().default(false),
});

const GET = async (req: Request) => {
  await requireUser(req);
  const rows = await db()
    .select()
    .from(actionTypes)
    .where(eq(actionTypes.deleted, false))
    .orderBy(asc(actionTypes.sortOrder), asc(actionTypes.createdAt));
  return json({ actionTypes: rows });
};

const POST = async (req: Request) => {
  await requireUser(req);
  const input = await parseBody(req, Input);
  const now = Date.now();
  const [row] = await db()
    .insert(actionTypes)
    .values({ id: newId(), ...input, createdAt: now, updatedAt: now })
    .returning();
  return json({ actionType: row }, { status: 201 });
};

const PATCH = async (req: Request) => {
  await requireUser(req);
  const id = idFromUrl(req);
  const input = await parseBody(req, Input.partial());
  const [row] = await db()
    .update(actionTypes)
    .set({ ...input, updatedAt: Date.now() })
    .where(and(eq(actionTypes.id, id), eq(actionTypes.deleted, false)))
    .returning();
  if (!row) fail(404, "Akce neexistuje.");
  return json({ actionType: row });
};

// Soft delete — historické záznamy si na akci pořád odkazují, tak ji nesmažeme
// nadobro; jen zmizí ze seznamů. Pro "už není potřeba" slouží archived.
const DELETE = async (req: Request) => {
  await requireUser(req);
  const id = idFromUrl(req);
  const now = Date.now();
  await db()
    .update(actionTypes)
    .set({ deleted: true, updatedAt: now })
    .where(eq(actionTypes.id, id));
  // Ať po smazané akci nezůstane odkaz z jiné akce.
  await db()
    .update(actionTypes)
    .set({ impliesActionId: null, updatedAt: now })
    .where(eq(actionTypes.impliesActionId, id));
  return json({ ok: true });
};

export default route({ GET, POST, PATCH, DELETE });
