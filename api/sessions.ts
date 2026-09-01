import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "./_lib/auth.js";
import { db, schema } from "./_lib/db.js";
import { fail, idFromUrl, json, newId, parseBody, route } from "./_lib/http.js";

const { careSessions, sessionEntries, users } = schema;

const EntryInput = z.object({
  actionTypeId: z.string().min(1),
  value: z.number().nonnegative().nullable().default(null),
});

const Input = z.object({
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().nullable().default(null),
  note: z.string().trim().max(500).nullable().default(null),
  entries: z.array(EntryInput).default([]),
});

/** Načte session + jejich odkliknuté akce + autora. */
async function loadSessions(sinceMs: number, limit: number) {
  const rows = await db()
    .select({
      id: careSessions.id,
      userId: careSessions.userId,
      authorName: users.displayName,
      startedAt: careSessions.startedAt,
      endedAt: careSessions.endedAt,
      note: careSessions.note,
      updatedAt: careSessions.updatedAt,
    })
    .from(careSessions)
    .innerJoin(users, eq(users.id, careSessions.userId))
    .where(and(eq(careSessions.deleted, false), gte(careSessions.startedAt, sinceMs)))
    .orderBy(desc(careSessions.startedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const entries = await db()
    .select()
    .from(sessionEntries)
    .where(
      inArray(
        sessionEntries.sessionId,
        rows.map((r) => r.id),
      ),
    );

  return rows.map((row) => ({
    ...row,
    entries: entries
      .filter((e) => e.sessionId === row.id)
      .map((e) => ({ id: e.id, actionTypeId: e.actionTypeId, value: e.value })),
  }));
}

const GET = async (req: Request) => {
  await requireUser(req);
  const params = new URL(req.url).searchParams;
  // Výchozí okno: 30 dní zpět — dashboard potřebuje max týdenní statistiky.
  const days = Number(params.get("days") ?? 30);
  const limit = Math.min(Number(params.get("limit") ?? 500), 1000);
  const since = Date.now() - (Number.isFinite(days) ? days : 30) * 86_400_000;
  return json({ sessions: await loadSessions(since, limit) });
};

const POST = async (req: Request) => {
  const user = await requireUser(req);
  const input = await parseBody(req, Input);
  const now = Date.now();
  const id = newId();

  await db().insert(careSessions).values({
    id,
    userId: user.id,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  });
  if (input.entries.length > 0) {
    await db().insert(sessionEntries).values(
      input.entries.map((e) => ({
        id: newId(),
        sessionId: id,
        actionTypeId: e.actionTypeId,
        value: e.value,
        createdAt: now,
      })),
    );
  }

  return json({ id }, { status: 201 });
};

const PATCH = async (req: Request) => {
  await requireUser(req);
  const id = idFromUrl(req);
  const input = await parseBody(req, Input.partial());
  const now = Date.now();

  const [row] = await db()
    .update(careSessions)
    .set({
      ...(input.startedAt !== undefined && { startedAt: input.startedAt }),
      ...(input.endedAt !== undefined && { endedAt: input.endedAt }),
      ...(input.note !== undefined && { note: input.note }),
      updatedAt: now,
    })
    .where(and(eq(careSessions.id, id), eq(careSessions.deleted, false)))
    .returning();
  if (!row) fail(404, "Záznam neexistuje.");

  // Odkliknuté akce se přepisují celé — dialog vždy posílá aktuální stav.
  if (input.entries) {
    await db().delete(sessionEntries).where(eq(sessionEntries.sessionId, id));
    if (input.entries.length > 0) {
      await db().insert(sessionEntries).values(
        input.entries.map((e) => ({
          id: newId(),
          sessionId: id,
          actionTypeId: e.actionTypeId,
          value: e.value,
          createdAt: now,
        })),
      );
    }
  }

  return json({ ok: true });
};

const DELETE = async (req: Request) => {
  await requireUser(req);
  const id = idFromUrl(req);
  await db()
    .update(careSessions)
    .set({ deleted: true, updatedAt: Date.now() })
    .where(eq(careSessions.id, id));
  return json({ ok: true });
};

export default route({ GET, POST, PATCH, DELETE });
