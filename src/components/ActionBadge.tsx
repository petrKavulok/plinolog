import { formatNumber } from "../lib/format";
import type { ActionType } from "../lib/types";

/**
 * Badge, kterou rodič odklikne. U množstevních akcí se po aktivaci
 * rozbalí pod ní rychlé předvolby (60 / 80 ml) a stepper — nikam se
 * neproklikává, všechno je na jeden dotek.
 */
export function ActionBadge({
  action,
  active,
  value,
  onToggle,
  onValueChange,
}: {
  action: ActionType;
  active: boolean;
  value: number | null;
  onToggle: () => void;
  onValueChange: (value: number) => void;
}) {
  const step = action.unit === "ml" ? 10 : 1;
  const current = value ?? action.defaultValue ?? 0;

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
              onClick={() => onValueChange(preset)}
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
              onClick={() => onValueChange(Math.max(0, current - step))}
            >
              −
            </StepButton>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={step}
              value={current}
              onChange={(e) => onValueChange(Math.max(0, Number(e.target.value)))}
              aria-label={`${action.label} — hodnota`}
              className="w-16 rounded-xl border border-line bg-surface px-2 py-1.5 text-center text-base text-ink outline-none focus:border-accent"
            />
            <StepButton label={`O ${step} více`} onClick={() => onValueChange(current + step)}>
              +
            </StepButton>
          </div>
        </div>
      )}
    </div>
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
