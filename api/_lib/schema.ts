import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
} from "drizzle-orm/pg-core";

// Časy jsou všude epoch milisekundy (stejně jako v appce na kontrakce) —
// klient je posílá i čte jako number, žádné časové zóny v DB.

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  // přihlašovací jméno, case-insensitive (ukládá se lowercase)
  username: text("username").notNull().unique(),
  // jméno zobrazené u záznamu ("Petr", "Maruška")
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

/**
 * Typ akce = to, co se dá u záznamu odkliknout jako badge.
 * Uživatelé si je spravují sami v adminu.
 */
export const actionTypes = pgTable("action_type", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  emoji: text("emoji").notNull(),
  // "event" = jen se stalo (kakání) | "quantity" = má hodnotu (dokrm 60 ml)
  kind: text("kind").notNull().$type<"event" | "quantity">().default("event"),
  unit: text("unit"), // "ml", "kapky", …
  // rychlé předvolby v dialogu, např. [40, 60, 80]
  presets: jsonb("presets").$type<number[]>().notNull().default([]),
  defaultValue: real("default_value"),
  // cíl pro dlaždici na dashboardu: 2 kapky týdně → period "week", value 2
  goalPeriod: text("goal_period")
    .notNull()
    .$type<"none" | "day" | "week">()
    .default("day"),
  goalValue: real("goal_value"),
  // u kojení dává smysl zvážit miminko před a po (rozdíl ≈ vypité ml)
  weighing: boolean("weighing").notNull().default(false),
  // tuhle akci měří stopky na dashboardu (a po „Hotovo" se předvybere)
  timed: boolean("timed").notNull().default(false),
  // po zapnutí téhle akce se v dialogu zapne i tahle další
  // (čůrání → přebalení). Bez FK: mazání akce je stejně soft delete
  // a osiřelé id dialog jen ignoruje.
  impliesActionId: text("implies_action_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  // "zrušená" akce — zůstane u historických záznamů, ale nenabízí se
  archived: boolean("archived").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

/**
 * Jedna "session" = jeden řádek v tabulce na dashboardu.
 * Typicky: nakrmeno v 3:12, u toho vykakáno a přebaleno.
 */
export const careSessions = pgTable(
  "care_session",
  {
    id: text("id").primaryKey(),
    // kdo záznam pořídil
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: bigint("started_at", { mode: "number" }).notNull(),
    endedAt: bigint("ended_at", { mode: "number" }),
    note: text("note"),
    deleted: boolean("deleted").notNull().default(false),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [index("care_session_started_at_idx").on(t.startedAt)],
);

/** Jednotlivá odkliknutá akce v rámci session. */
export const sessionEntries = pgTable(
  "session_entry",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => careSessions.id, { onDelete: "cascade" }),
    actionTypeId: text("action_type_id")
      .notNull()
      .references(() => actionTypes.id, { onDelete: "restrict" }),
    value: real("value"),
    // váha miminka v gramech, jen u akcí s zapnutým vážením
    weightBefore: real("weight_before"),
    weightAfter: real("weight_after"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("session_entry_session_idx").on(t.sessionId)],
);
