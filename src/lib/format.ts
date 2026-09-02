const time = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" });
const dayLong = new Intl.DateTimeFormat("cs-CZ", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export const formatTime = (ms: number) => time.format(ms);

/** "Dnes" / "Včera" / "pondělí 1. září" */
export function formatDayLabel(ms: number): string {
  const day = startOfDay(ms);
  const today = startOfDay(Date.now());
  if (day === today) return "Dnes";
  if (day === today - 86_400_000) return "Včera";
  return dayLong.format(ms);
}

/** Délka v minutách jako "24 min" nebo "1 h 05 min". */
export function formatDuration(fromMs: number, toMs: number): string {
  const totalMin = Math.max(0, Math.round((toMs - fromMs) / 60_000));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  return `${h} h ${String(totalMin % 60).padStart(2, "0")} min`;
}

/** Stopky pro běžící krmení: "07:32". */
export function formatStopwatch(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** "před 42 min" — hlavní informace na dashboardu ve 3 ráno. */
export function formatAgo(ms: number, now = Date.now()): string {
  const min = Math.round((now - ms) / 60_000);
  if (min < 1) return "právě teď";
  if (min < 60) return `před ${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  if (h < 24) return rest ? `před ${h} h ${rest} min` : `před ${h} h`;
  const d = Math.floor(h / 24);
  return `před ${d} ${plural(d, "dnem", "dny", "dny")}`;
}

/** Česká pluralizace: 1 / 2–4 / 5+ */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/** Čísla bez zbytečných desetinných nul: 60, 2.5 */
export const formatNumber = (n: number) =>
  new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(n);

export const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Začátek týdne — pondělí, jak se v Česku počítá. */
export const startOfWeek = (ms: number) => {
  const d = new Date(startOfDay(ms));
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return d.getTime();
};

/** Na kolik minut se zaokrouhlují ručně zadané časy. */
export const TIME_STEP_MIN = 10;

/** "HH:MM" pro <input type="time">. */
export function toTimeInput(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" pro <input type="date">. */
export function toDateInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Nasadí čas "HH:MM" na daný den, zaokrouhlený na desetiminutovky. */
export function withTime(dayMs: number, time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return dayMs;
  const d = new Date(dayMs);
  d.setHours(h, Math.round(m / TIME_STEP_MIN) * TIME_STEP_MIN, 0, 0);
  return d.getTime();
}

/** Přenese čas z původní hodnoty na jiný den. */
export function withDay(originalMs: number, dayMs: number): number {
  const src = new Date(originalMs);
  const d = new Date(dayMs);
  d.setHours(src.getHours(), src.getMinutes(), 0, 0);
  return d.getTime();
}

export const fromDateInput = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};
