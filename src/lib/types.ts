export type User = {
  id: string;
  username: string;
  displayName: string;
};

/** "event" = jen se stalo · "quantity" = zadává se hodnota (ml, kapky, …) */
export type ActionKind = "event" | "quantity";

/** Za jaké období se na dashboardu počítá souhrn. */
export type GoalPeriod = "none" | "day" | "week";

export type ActionType = {
  id: string;
  label: string;
  emoji: string;
  kind: ActionKind;
  unit: string | null;
  presets: number[];
  defaultValue: number | null;
  goalPeriod: GoalPeriod;
  goalValue: number | null;
  /** zapíná zadání váhy miminka před a po (rozdíl ≈ vypité ml) */
  weighing: boolean;
  /** tuhle akci měří stopky na dashboardu a po „Hotovo" se předvybere */
  timed: boolean;
  /** po zapnutí téhle akce se zapne i tato další (čůrání → přebalení) */
  impliesActionId: string | null;
  sortOrder: number;
  archived: boolean;
};

export type ActionTypeInput = Omit<ActionType, "id">;

export type SessionEntry = {
  actionTypeId: string;
  value: number | null;
  /** váha miminka v gramech před a po — jen u akcí s vážením */
  weightBefore: number | null;
  weightAfter: number | null;
};

export type CareSession = {
  id: string;
  userId: string;
  authorName: string;
  startedAt: number;
  endedAt: number | null;
  note: string | null;
  updatedAt: number;
  entries: SessionEntry[];
};

export type SessionInput = {
  startedAt: number;
  endedAt: number | null;
  note: string | null;
  entries: SessionEntry[];
};
