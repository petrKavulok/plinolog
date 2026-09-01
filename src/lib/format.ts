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

/** Hodnota pro <input type="datetime-local"> v místním čase. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

export const fromLocalInput = (value: string) => new Date(value).getTime();
