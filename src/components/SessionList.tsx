import { formatDayLabel, formatDuration, formatNumber, formatTime } from "../lib/format";
import { groupByDay } from "../lib/stats";
import type { ActionType, CareSession } from "../lib/types";

export function SessionList({
  sessions,
  actions,
  onEdit,
  onDelete,
}: {
  sessions: CareSession[];
  actions: ActionType[];
  onEdit: (session: CareSession) => void;
  onDelete: (session: CareSession) => void;
}) {
  const byId = new Map(actions.map((a) => [a.id, a]));
  const days = groupByDay(sessions);

  if (days.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-line px-4 py-10 text-center text-muted">
        Zatím žádné záznamy. Klepni na <strong className="text-ink">+</strong> dole.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {days.map(({ day, items }) => (
        <section key={day} className="flex flex-col gap-2">
          <h3 className="sticky top-0 z-10 bg-bg/90 py-1 text-sm font-semibold text-muted backdrop-blur">
            {formatDayLabel(day)}
          </h3>
          {items.map((session) => (
            <article
              key={session.id}
              className="flex items-start gap-3 rounded-3xl border border-line bg-surface p-4"
            >
              <div className="flex w-16 shrink-0 flex-col">
                <span className="text-lg font-bold tabular-nums">
                  {formatTime(session.startedAt)}
                </span>
                {session.endedAt !== null && (
                  <span className="text-xs text-muted">
                    {formatDuration(session.startedAt, session.endedAt)}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {session.entries.map((entry) => {
                    const action = byId.get(entry.actionTypeId);
                    if (!action) return null;
                    return (
                      <span
                        key={entry.actionTypeId}
                        className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-sm"
                        title={action.label}
                      >
                        <span aria-hidden>{action.emoji}</span>
                        <span className="text-muted">{action.label}</span>
                        {entry.value !== null && (
                          <strong className="text-ink">
                            {formatNumber(entry.value)}
                            {action.unit ? ` ${action.unit}` : ""}
                          </strong>
                        )}
                      </span>
                    );
                  })}
                </div>
                {session.note && <p className="text-sm text-muted">{session.note}</p>}
                <span className="text-xs text-muted">zápis: {session.authorName}</span>
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(session)}
                  aria-label={`Upravit záznam z ${formatTime(session.startedAt)}`}
                  className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(session)}
                  aria-label={`Smazat záznam z ${formatTime(session.startedAt)}`}
                  className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                >
                  🗑️
                </button>
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
