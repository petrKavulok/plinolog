import { useMemo, useState } from "react";
import { FeedingTimer, useFeedingTimer } from "../components/FeedingTimer";
import { SessionDialog } from "../components/SessionDialog";
import { SessionList } from "../components/SessionList";
import { StatCard } from "../components/StatCard";
import { ErrorNote, Spinner } from "../components/ui";
import { api } from "../lib/api";
import { summarize } from "../lib/stats";
import type { CareSession } from "../lib/types";
import { useData } from "../state/data";

export function DashboardPage() {
  const { actions, sessions, loading, error, reload } = useData();
  const timer = useFeedingTimer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CareSession | null>(null);
  const [prefill, setPrefill] = useState<{ startedAt?: number; endedAt?: number | null }>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useMemo(() => summarize(actions, sessions), [actions, sessions]);

  function openNew(prefillValues: typeof prefill = {}) {
    setEditing(null);
    setPrefill(prefillValues);
    setDialogOpen(true);
  }

  function finishTimer() {
    // Stopky doběhly → dialog se otevře s vyplněným začátkem i koncem.
    if (timer.startedAt === null) return;
    openNew({ startedAt: timer.startedAt, endedAt: Date.now() });
    timer.stop();
  }

  async function remove(session: CareSession) {
    if (!confirm("Opravdu smazat tenhle záznam?")) return;
    try {
      await api.deleteSession(session.id);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Smazání selhalo.");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6 pb-28">
      <FeedingTimer
        startedAt={timer.startedAt}
        onStart={timer.start}
        onFinish={finishTimer}
        onCancel={timer.stop}
      />

      <ErrorNote>{error ?? actionError}</ErrorNote>

      {stats.length > 0 && (
        <section className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.action.id} stat={stat} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Záznamy</h2>
        <SessionList
          sessions={sessions}
          actions={actions}
          onEdit={(session) => {
            setEditing(session);
            setDialogOpen(true);
          }}
          onDelete={remove}
        />
      </section>

      <button
        type="button"
        onClick={() => openNew()}
        aria-label="Přidat záznam"
        className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-20 flex size-16 items-center justify-center rounded-full bg-accent text-4xl font-light text-accent-ink shadow-lg shadow-black/30 transition active:scale-95"
      >
        +
      </button>

      <SessionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
        actions={actions}
        editing={editing}
        initialStartedAt={prefill.startedAt}
        initialEndedAt={prefill.endedAt ?? null}
      />
    </div>
  );
}
