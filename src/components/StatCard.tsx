import { formatAgo, formatNumber, plural } from "../lib/format";
import type { ActionStat } from "../lib/stats";

/** Dlaždice na dashboardu: kolikrát dnes / kolik ml / kdy naposledy. */
export function StatCard({ stat }: { stat: ActionStat }) {
  const { action, count, sum, lastAt, lastInPeriod, goalValue, progress } = stat;
  // U minulých období nedává smysl hlásit dnešní výskyt — držíme se období.
  const past = stat.periodLabel === "včera" || stat.periodLabel === "minulý týden";
  const shown = past ? lastInPeriod : lastAt;
  const quantity = action.kind === "quantity";
  const value = quantity ? sum : count;
  const unit = quantity ? (action.unit ?? "") : plural(count, "krát", "krát", "krát");

  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-2xl leading-none">
          {action.emoji}
        </span>
        <span className="truncate text-sm font-medium text-muted">{action.label}</span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{formatNumber(value)}</span>
        <span className="text-sm text-muted">{unit}</span>
        {goalValue !== null && (
          <span className="text-sm text-muted">/ {formatNumber(goalValue)}</span>
        )}
      </div>

      {progress !== null && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${action.label} — plnění cíle`}
        >
          <div
            className={`h-full rounded-full transition-[width] ${
              progress >= 1 ? "bg-ok" : "bg-accent"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <span className="text-xs text-muted">
        {stat.periodLabel} · {shown ? formatAgo(shown) : "nic"}
      </span>
    </div>
  );
}
