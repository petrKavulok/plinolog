import { useEffect, useState } from "react";
import { formatStopwatch, formatTime } from "../lib/format";
import { Button } from "./ui";

const KEY = "plinolog:timer";

/**
 * Stopky krmení. Začátek žije v localStorage, takže přežijí zamčený
 * telefon i refresh — vrátíš se do appky a stopky pořád běží.
 */
export function useFeedingTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(KEY);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  });

  useEffect(() => {
    if (startedAt === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(startedAt));
  }, [startedAt]);

  return {
    startedAt,
    start: () => setStartedAt(Date.now()),
    stop: () => setStartedAt(null),
  };
}

export function FeedingTimer({
  startedAt,
  onStart,
  onFinish,
  onCancel,
}: {
  startedAt: number | null;
  onStart: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt === null) {
    return (
      <Button size="lg" onClick={onStart} className="w-full">
        ⏱️ Začít krmení
      </Button>
    );
  }

  return (
    <div className="animate-pop flex items-center gap-3 rounded-3xl border border-accent bg-accent/10 p-4">
      <div className="flex flex-1 flex-col">
        <span className="text-3xl font-bold tabular-nums">
          {formatStopwatch(now - startedAt)}
        </span>
        <span className="text-xs text-muted">běží od {formatTime(startedAt)}</span>
      </div>
      <Button onClick={onFinish}>Hotovo</Button>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 px-2 text-sm text-muted hover:text-ink"
      >
        Zrušit
      </button>
    </div>
  );
}
