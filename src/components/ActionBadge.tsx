import { formatNumber } from "../lib/format";
import type { ActionType } from "../lib/types";

/** Rozpracovaná položka záznamu — co uživatel u akce naklikal. */
export type PickedEntry = {
  value: number | null;
  weightBefore: number | null;
  weightAfter: number | null;
};

/** Rozdíl vah v gramech ≈ vypité množství. Null, dokud nejsou obě. */
export function weighedIntake(entry: {
  weightBefore: number | null;
  weightAfter: number | null;
}): number | null {
  if (entry.weightBefore === null || entry.weightAfter === null) return null;
  const diff = entry.weightAfter - entry.weightBefore;
  return diff > 0 ? diff : null;
}

/**
 * Badge, kterou rodič odklikne. U množstevních akcí se po aktivaci
 * rozbalí pod ní rychlé předvolby (60 / 80 ml) a stepper, u akcí
 * s vážením dvě políčka na váhu před a po — vždy nepovinná.
 */
export function ActionBadge({
  action,
  active,
  entry,
  onToggle,
  onChange,
}: {
  action: ActionType;
  active: boolean;
  entry: PickedEntry | null;
  onToggle: () => void;
  onChange: (patch: Partial<PickedEntry>) => void;
}) {
  const step = action.unit === "ml" ? 10 : 1;
  const current = entry?.value ?? action.defaultValue ?? 0;
  const intake = entry ? weighedIntake(entry) : null;

  return (
    <div
      className={`rounded-3xl border transition ${
        active ? "border-accent bg-accent/10" : "border-line bg-surface-2"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span aria-hidden className="text-3xl leading-none">
          {action.emoji}
        </span>
        <span className="flex-1">
          <span className={`block font-semibold ${active ? "text-ink" : "text-muted"}`}>
            {action.label}
          </span>
          {active && action.kind === "quantity" && (
            <span className="text-sm text-accent">
              {formatNumber(current)} {action.unit ?? ""}
            </span>
          )}
          {active && intake !== null && (
            <span className="text-sm text-accent">vypito ~{formatNumber(intake)} g</span>
          )}
        </span>
        <span
          aria-hidden
          className={`flex size-6 items-center justify-center rounded-full text-sm font-bold ${
            active ? "bg-accent text-accent-ink" : "border border-line text-transparent"
          }`}
        >
          ✓
        </span>
      </button>

      {active && action.kind === "quantity" && (
        <div className="animate-fade flex flex-wrap items-center gap-2 px-4 pb-3">
          {action.presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ value: preset })}
              className={`min-h-9 rounded-full px-3 text-sm font-semibold transition ${
                current === preset
                  ? "bg-accent text-accent-ink"
                  : "bg-surface text-muted hover:text-ink"
              }`}
            >
              {formatNumber(preset)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <StepButton
              label={`O ${step} méně`}
              onClick={() => onChange({ value: Math.max(0, current - step) })}
            >
              −
            </StepButton>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={step}
              value={current}
              onChange={(e) => onChange({ value: Math.max(0, Number(e.target.value)) })}
              aria-label={`${action.label} — hodnota`}
              className="w-16 rounded-xl border border-line bg-surface px-2 py-1.5 text-center text-base text-ink outline-none focus:border-accent"
            />
            <StepButton
              label={`O ${step} více`}
              onClick={() => onChange({ value: current + step })}
            >
              +
            </StepButton>
          </div>
        </div>
      )}

      {active && action.weighing && (
        <div className="animate-fade flex items-end gap-2 px-4 pb-3">
          <WeightInput
            label="Váha před"
            actionLabel={action.label}
            value={entry?.weightBefore ?? null}
            onChange={(weightBefore) => onChange({ weightBefore })}
          />
          <span aria-hidden className="pb-2.5 text-muted">
            →
          </span>
          <WeightInput
            label="Váha po"
            actionLabel={action.label}
            value={entry?.weightAfter ?? null}
            onChange={(weightAfter) => onChange({ weightAfter })}
          />
        </div>
      )}
    </div>
  );
}

function WeightInput({
  label,
  actionLabel,
  value,
  onChange,
}: {
  label: string;
  actionLabel: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-xs text-muted">{label} (g)</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={5}
        value={value ?? ""}
        placeholder="—"
        aria-label={`${actionLabel} — ${label.toLowerCase()} v gramech`}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="w-full rounded-xl border border-line bg-surface px-2 py-1.5 text-center text-base text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-surface text-xl font-bold text-ink"
    >
      {children}
    </button>
  );
}
