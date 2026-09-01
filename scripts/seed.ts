/**
 * Naplní čerstvou databázi rozumnou sadou akcí, ať se nemusí naklikávat ručně.
 * Spuštění:  npm run db:seed
 * Pouští se bezpečně opakovaně — už existující akce (podle názvu) přeskočí.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { actionTypes } from "../api/_lib/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Chybí DATABASE_URL — zkontroluj .env.local.");

const db = drizzle(neon(url));

const DEFAULTS = [
  { label: "Kojení", emoji: "🤱", kind: "event", goalPeriod: "day", goalValue: 8 },
  {
    label: "Dokrm",
    emoji: "🍼",
    kind: "quantity",
    unit: "ml",
    presets: [40, 60, 80, 100],
    defaultValue: 60,
    goalPeriod: "day",
    goalValue: null,
  },
  { label: "Kakání", emoji: "💩", kind: "event", goalPeriod: "day", goalValue: null },
  { label: "Čůrání", emoji: "💧", kind: "event", goalPeriod: "day", goalValue: null },
  { label: "Přebalení", emoji: "🧷", kind: "event", goalPeriod: "day", goalValue: 6 },
  {
    label: "Vitamín D",
    emoji: "☀️",
    kind: "quantity",
    unit: "kapky",
    presets: [1, 2],
    defaultValue: 1,
    goalPeriod: "day",
    goalValue: 1,
  },
  {
    label: "Vitamín K",
    emoji: "💊",
    kind: "quantity",
    unit: "kapky",
    presets: [1, 2],
    defaultValue: 2,
    goalPeriod: "week",
    goalValue: 2,
  },
] as const;

const existing = new Set(
  (await db.select({ label: actionTypes.label }).from(actionTypes)).map((r) => r.label),
);

const now = Date.now();
const rows = DEFAULTS.filter((d) => !existing.has(d.label)).map((d, i) => ({
  id: crypto.randomUUID(),
  label: d.label,
  emoji: d.emoji,
  kind: d.kind,
  unit: "unit" in d ? d.unit : null,
  presets: "presets" in d ? [...d.presets] : [],
  defaultValue: "defaultValue" in d ? d.defaultValue : null,
  goalPeriod: d.goalPeriod,
  goalValue: d.goalValue,
  sortOrder: existing.size + i,
  createdAt: now,
  updatedAt: now,
}));

if (rows.length === 0) {
  console.log("Všechny výchozí akce už existují — nic nepřidávám.");
} else {
  await db.insert(actionTypes).values(rows);
  console.log(`Přidáno ${rows.length} akcí: ${rows.map((r) => r.label).join(", ")}`);
}
