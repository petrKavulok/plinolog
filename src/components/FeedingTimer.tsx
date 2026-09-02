import { useEffect, useRef, useState } from "react";
import type { ActionType } from "../lib/types";
import { formatStopwatch, formatTime } from "../lib/format";
import { playAlarm, unlockAudio, vibrate } from "../lib/sound";
import { useWakeLock } from "../state/useWakeLock";
import { Button } from "./ui";

const KEY = "plinolog:timer";
const SOUND_KEY = "plinolog:timer-sound";
const WEIGHT_KEY = "plinolog:timer-weight-before";

/** Po jaké době běžícího krmení appka zazvoní. */
export const ALARM_AFTER_MS = 15 * 60 * 1000;
const ALARM_AFTER_MIN = Math.round(ALARM_AFTER_MS / 60_000);

/**
 * Stopky krmení. Začátek žije v localStorage, takže přežijí zamčený
 * telefon i refresh — vrátíš se do appky a stopky pořád běží.
 */
export function useFeedingTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(() => readNumber(KEY));
  // Váha před krmením v gramech — přežije zamčený telefon stejně jako stopky.
  const [weightBefore, setWeightBefore] = useState<number | null>(() =>
    readNumber(WEIGHT_KEY),
  );

  useEffect(() => {
    if (startedAt === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(startedAt));
  }, [startedAt]);

  useEffect(() => {
    if (weightBefore === null) localStorage.removeItem(WEIGHT_KEY);
    else localStorage.setItem(WEIGHT_KEY, String(weightBefore));
  }, [weightBefore]);

  return {
    startedAt,
    weightBefore,
    setWeightBefore,
    start: () => {
      // Odemknutí zvuku musí proběhnout v obsluze kliknutí.
      unlockAudio();
      setWeightBefore(null);
      setStartedAt(Date.now());
    },
    stop: () => {
      setStartedAt(null);
      setWeightBefore(null);
    },
  };
}

function readNumber(key: string): number | null {
  const raw = localStorage.getItem(key);
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : null;
}

export function FeedingTimer({
  startedAt,
  weightBefore,
  onWeightBefore,
  action,
  onStart,
  onFinish,
  onCancel,
}: {
  startedAt: number | null;
  weightBefore: number | null;
  onWeightBefore: (value: number | null) => void;
  /** akce, kterou stopky měří — dává jim název i políčko na váhu */
  action: ActionType | null;
  onStart: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const [soundOn, setSoundOn] = useState(
    () => localStorage.getItem(SOUND_KEY) !== "off",
  );
  const [weightOpen, setWeightOpen] = useState(false);
  // Ke kterým stopkám už zvonění proběhlo — ať se neopakuje při překreslení.
  const alarmedFor = useRef<number | null>(null);

  // Dokud stopky běží, displej nezhasne — jinak by systém uspal časovač.
  useWakeLock(startedAt !== null);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt === null ? 0 : now - startedAt;
  const overdue = startedAt !== null && elapsed >= ALARM_AFTER_MS;

  useEffect(() => {
    if (startedAt === null) {
      alarmedFor.current = null;
      return;
    }
    if (!overdue || alarmedFor.current === startedAt) return;
    // Zvoníme jen jednou na jedny stopky. Když se appka otevře až po
    // uplynutí limitu, ozve se hned po návratu — což je pořád užitečné.
    alarmedFor.current = startedAt;
    if (soundOn) {
      playAlarm();
      vibrate();
    }
  }, [overdue, startedAt, soundOn]);

  function toggleSound() {
    setSoundOn((on) => {
      const next = !on;
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      if (next) unlockAudio();
      return next;
    });
  }

  if (startedAt === null) {
    return (
      <Button size="lg" onClick={onStart} className="w-full">
        ⏱️ Začít {action ? action.label.toLowerCase() : "krmení"}
      </Button>
    );
  }

  return (
    <div
      className={`animate-pop flex flex-col gap-2 rounded-3xl border p-4 ${
        overdue ? "border-accent-strong bg-accent/20" : "border-accent bg-accent/10"
      }`}
    >
      <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-3xl font-bold tabular-nums">
          {formatStopwatch(elapsed)}
        </span>
        <span className="truncate text-xs text-muted">
          {overdue ? `přes ${ALARM_AFTER_MIN} min · ` : ""}od {formatTime(startedAt)}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleSound}
        aria-label={`${soundOn ? "Vypnout" : "Zapnout"} zvonění po ${ALARM_AFTER_MIN} minutách`}
        aria-pressed={soundOn}
        title={soundOn ? `Zazvoní po ${ALARM_AFTER_MIN} minutách` : "Zvonění vypnuté"}
        className="flex size-10 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        {soundOn ? "🔔" : "🔕"}
      </button>
      <Button onClick={onFinish}>Hotovo</Button>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 px-2 text-sm text-muted hover:text-ink"
      >
        Zrušit
      </button>
      </div>

      {action?.weighing &&
        (weightOpen || weightBefore !== null ? (
          <label className="animate-fade flex items-center gap-2">
            <span className="text-sm text-muted">Váha před (g)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              autoFocus={weightOpen && weightBefore === null}
              value={weightBefore ?? ""}
              placeholder="—"
              onChange={(e) =>
                onWeightBefore(e.target.value === "" ? null : Number(e.target.value))
              }
              className="w-24 rounded-xl border border-line bg-surface px-2 py-1.5 text-center text-base text-ink outline-none focus:border-accent"
            />
            <span className="text-xs text-muted">
              Váhu po zadáš při ukládání záznamu.
            </span>
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setWeightOpen(true)}
            className="min-h-9 self-start text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            ⚖️ Zadat váhu před
          </button>
        ))}
    </div>
  );
}
