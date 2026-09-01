import { startOfDay, startOfWeek } from "./format";
import type { ActionType, CareSession } from "./types";

const DAY = 86_400_000;

/** Který den se na dashboardu sčítá. */
export type StatsDay = "today" | "yesterday";

export type ActionStat = {
  action: ActionType;
  /** kolikrát se akce v daném období stala */
  count: number;
  /** součet hodnot (jen u kind === "quantity") */
  sum: number;
  /** kdy naposledy napříč celou historií — užitečné u pohledu na dnešek */
  lastAt: number | null;
  /** kdy naposledy uvnitř vybraného období */
  lastInPeriod: number | null;
  goalValue: number | null;
  /** 0–1, jen když je cíl nastavený */
  progress: number | null;
  /** popisek období do dlaždice: „dnes", „včera", „tento týden" */
  periodLabel: string;
};

/** Půlnoc dne, za který se počítá. */
export const dayStartFor = (day: StatsDay, now = Date.now()) =>
  startOfDay(now) - (day === "yesterday" ? DAY : 0);

/**
 * Souhrn za období podle nastavení akce: denní akce se počítají za vybraný
 * den, týdenní za týden, do kterého ten den spadá (od pondělí). Akce
 * s goalPeriod "none" se na dashboardu nesčítají.
 */
export function summarize(
  actions: ActionType[],
  sessions: CareSession[],
  day: StatsDay = "today",
): ActionStat[] {
  const now = Date.now();
  const dayStart = dayStartFor(day, now);
  const weekStart = startOfWeek(dayStart);
  const thisWeek = weekStart === startOfWeek(now);

  return actions
    .filter((a) => !a.archived && a.goalPeriod !== "none")
    .map((action) => {
      const weekly = action.goalPeriod === "week";
      const from = weekly ? weekStart : dayStart;
      const to = from + (weekly ? 7 * DAY : DAY);

      let count = 0;
      let sum = 0;
      let lastAt: number | null = null;
      let lastInPeriod: number | null = null;

      for (const session of sessions) {
        for (const entry of session.entries) {
          if (entry.actionTypeId !== action.id) continue;
          if (lastAt === null || session.startedAt > lastAt) lastAt = session.startedAt;
          if (session.startedAt < from || session.startedAt >= to) continue;
          if (lastInPeriod === null || session.startedAt > lastInPeriod) {
            lastInPeriod = session.startedAt;
          }
          count += 1;
          sum += entry.value ?? 0;
        }
      }

      // U množstevních akcí porovnáváme s cílem součet (60+60 ml), jinak počet.
      const achieved = action.kind === "quantity" ? sum : count;
      return {
        action,
        count,
        sum,
        lastAt,
        lastInPeriod,
        goalValue: action.goalValue,
        progress: action.goalValue ? Math.min(1, achieved / action.goalValue) : null,
        periodLabel: weekly
          ? thisWeek
            ? "tento týden"
            : "minulý týden"
          : day === "yesterday"
            ? "včera"
            : "dnes",
      };
    });
}

/** Poslední session, která má danou akci — pro „naposledy krmeno". */
export function lastSessionWith(
  sessions: CareSession[],
  actionId: string,
): CareSession | null {
  let best: CareSession | null = null;
  for (const s of sessions) {
    if (!s.entries.some((e) => e.actionTypeId === actionId)) continue;
    if (!best || s.startedAt > best.startedAt) best = s;
  }
  return best;
}

/** Seskupí záznamy po dnech pro tabulku na dashboardu. */
export function groupByDay(sessions: CareSession[]): { day: number; items: CareSession[] }[] {
  const map = new Map<number, CareSession[]>();
  for (const s of sessions) {
    const day = startOfDay(s.startedAt);
    const list = map.get(day);
    if (list) list.push(s);
    else map.set(day, [s]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([day, items]) => ({
      day,
      items: items.sort((a, b) => b.startedAt - a.startedAt),
    }));
}
