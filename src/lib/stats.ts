import { startOfDay, startOfWeek } from "./format";
import type { ActionType, CareSession } from "./types";

export type ActionStat = {
  action: ActionType;
  /** kolikrát se akce stala v daném období */
  count: number;
  /** součet hodnot (jen u kind === "quantity") */
  sum: number;
  /** kdy naposledy */
  lastAt: number | null;
  goalValue: number | null;
  /** 0–1, jen když je cíl nastavený */
  progress: number | null;
};

/**
 * Souhrn za období podle nastavení akce: denní akce se počítají od půlnoci,
 * týdenní od pondělí. Akce s goalPeriod "none" se na dashboardu nesčítají.
 */
export function summarize(actions: ActionType[], sessions: CareSession[]): ActionStat[] {
  const now = Date.now();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);

  return actions
    .filter((a) => !a.archived && a.goalPeriod !== "none")
    .map((action) => {
      const since = action.goalPeriod === "week" ? weekStart : dayStart;
      let count = 0;
      let sum = 0;
      let lastAt: number | null = null;

      for (const session of sessions) {
        for (const entry of session.entries) {
          if (entry.actionTypeId !== action.id) continue;
          if (lastAt === null || session.startedAt > lastAt) lastAt = session.startedAt;
          if (session.startedAt < since) continue;
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
        goalValue: action.goalValue,
        progress: action.goalValue ? Math.min(1, achieved / action.goalValue) : null,
      };
    });
}

/** Poslední session, která má danou akci — pro "naposledy krmeno". */
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
