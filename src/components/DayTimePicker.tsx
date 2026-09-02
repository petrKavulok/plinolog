import { useState } from "react";
import {
  TIME_STEP_MIN,
  fromDateInput,
  startOfDay,
  toDateInput,
  toTimeInput,
  withDay,
  withTime,
} from "../lib/format";

/**
 * Den + čas bez nativního `datetime-local`.
 *
 * Rok v nativním inputu skrýt nejde, a na mobilu se do dvou sloupců stejně
 * nevejde. Skoro každý záznam je dnešní nebo včerejší, takže den řešíme
 * dvěma tlačítky a kalendář nabídneme, jen když je potřeba starší datum.
 * Čas se zaokrouhluje na desetiminutovky.
 */
export function DayTimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (ms: number) => void;
}) {
  const today = startOfDay(Date.now());
  const day = startOfDay(value);
  const isToday = day === today;
  const isYesterday = day === today - 86_400_000;
  // Vyžádané rozbalení držíme ve stavu, ale samotnou viditelnost odvozujeme
  // z hodnoty — dialog zůstává v DOM, takže stav by u úpravy staršího
  // záznamu zůstal viset na tom, co platilo při prvním vykreslení.
  const [expanded, setExpanded] = useState(false);
  const showDate = expanded || (!isToday && !isYesterday);

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-muted">{label}</legend>

      <div className="flex gap-1.5">
        <DayChip active={isToday} onClick={() => onChange(withDay(value, today))}>
          Dnes
        </DayChip>
        <DayChip
          active={isYesterday}
          onClick={() => onChange(withDay(value, today - 86_400_000))}
        >
          Včera
        </DayChip>
        <DayChip
          active={!isToday && !isYesterday}
          onClick={() => setExpanded((open) => !open)}
          aria-label="Jiné datum"
        >
          📅
        </DayChip>

        <input
          type="time"
          step={TIME_STEP_MIN * 60}
          value={toTimeInput(value)}
          onChange={(e) => onChange(withTime(value, e.target.value))}
          aria-label={`${label} — čas`}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-2 px-3 py-2.5 text-center text-base tabular-nums text-ink outline-none focus:border-accent"
        />
      </div>

      {showDate && (
        <input
          type="date"
          value={toDateInput(value)}
          onChange={(e) =>
            e.target.value && onChange(withDay(value, fromDateInput(e.target.value)))
          }
          aria-label={`${label} — datum`}
          className="animate-fade w-full rounded-2xl border border-line bg-surface-2 px-3 py-2.5 text-base text-ink outline-none focus:border-accent"
        />
      )}
    </fieldset>
  );
}

function DayChip({
  active,
  onClick,
  children,
  ...rest
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 rounded-2xl px-3 text-sm font-semibold transition ${
        active
          ? "bg-accent text-accent-ink"
          : "border border-line bg-surface-2 text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
