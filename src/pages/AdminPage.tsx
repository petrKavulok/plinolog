import { useState } from "react";
import { ActionForm } from "../components/ActionForm";
import { Button, ErrorNote, Spinner } from "../components/ui";
import { api } from "../lib/api";
import { formatNumber } from "../lib/format";
import type { ActionType, ActionTypeInput } from "../lib/types";
import { useData } from "../state/data";

export function AdminPage() {
  const { actions, sessions, loading, error, reload } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ActionType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function submit(input: ActionTypeInput) {
    if (editing) await api.updateActionType(editing.id, input);
    else await api.createActionType({ ...input, sortOrder: actions.length });
    await reload();
  }

  async function move(action: ActionType, direction: -1 | 1) {
    const index = actions.findIndex((a) => a.id === action.id);
    const other = actions[index + direction];
    if (!other) return;
    try {
      await Promise.all([
        api.updateActionType(action.id, { sortOrder: other.sortOrder }),
        api.updateActionType(other.id, { sortOrder: action.sortOrder }),
      ]);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Přesun selhal.");
    }
  }

  async function remove(action: ActionType) {
    const used = sessions.filter((s) =>
      s.entries.some((e) => e.actionTypeId === action.id),
    ).length;
    const message = used
      ? `Akce „${action.label}“ je u ${used} záznamů. Po smazání se u nich přestane zobrazovat.\n\nTip: místo mazání ji můžeš označit jako zrušenou.\n\nOpravdu smazat?`
      : `Opravdu smazat akci „${action.label}“?`;
    if (!confirm(message)) return;
    try {
      await api.deleteActionType(action.id);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Smazání selhalo.");
    }
  }

  async function toggleArchived(action: ActionType) {
    try {
      await api.updateActionType(action.id, { archived: !action.archived });
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Změna selhala.");
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Sledované akce</h2>
          <p className="text-sm text-muted">
            Ukazují se jako badge při zápisu nového záznamu.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Přidat
        </Button>
      </div>

      <ErrorNote>{error ?? actionError}</ErrorNote>

      {actions.length === 0 && (
        <p className="rounded-3xl border border-dashed border-line px-4 py-10 text-center text-muted">
          Zatím žádné akce. Přidej si třeba Krmení, Dokrm, Kakání, Čůrání a Vitamín D.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {actions.map((action, index) => (
          <li
            key={action.id}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-3xl border border-line bg-surface p-3 ${
              action.archived ? "opacity-55" : ""
            }`}
          >
            <span aria-hidden className="text-3xl leading-none">
              {action.emoji}
            </span>

            <div className="min-w-0 flex-1 basis-40">
              <p className="font-semibold">
                {action.label}
                {action.archived && (
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    zrušená
                  </span>
                )}
              </p>
              <p className="text-xs text-muted">{describe(action, actions)}</p>
            </div>

            {/* Na úzkém displeji se tlačítka zalomí pod text, ať se název nekrátí. */}
            <div className="ml-auto flex shrink-0 items-center">
              <IconButton
                label="Nahoru"
                disabled={index === 0}
                onClick={() => move(action, -1)}
              >
                ↑
              </IconButton>
              <IconButton
                label="Dolů"
                disabled={index === actions.length - 1}
                onClick={() => move(action, 1)}
              >
                ↓
              </IconButton>
              <IconButton
                label={action.archived ? "Obnovit" : "Zrušit"}
                onClick={() => toggleArchived(action)}
              >
                {action.archived ? "♻️" : "🚫"}
              </IconButton>
              <IconButton
                label="Upravit"
                onClick={() => {
                  setEditing(action);
                  setFormOpen(true);
                }}
              >
                ✏️
              </IconButton>
              <IconButton label="Smazat" onClick={() => remove(action)}>
                🗑️
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <ActionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        editing={editing}
        actions={actions}
      />
    </div>
  );
}

/** Krátký popis nastavení akce do seznamu. */
function describe(action: ActionType, all: ActionType[]): string {
  const parts: string[] = [];
  if (action.kind === "quantity") {
    parts.push(`množství${action.unit ? ` (${action.unit})` : ""}`);
    if (action.presets.length) parts.push(action.presets.map(formatNumber).join(" / "));
  } else {
    parts.push("jen odkliknutí");
  }
  if (action.timed) parts.push("měří se stopkami");
  if (action.weighing) parts.push("vážení před a po");
  const implied = all.find((a) => a.id === action.impliesActionId);
  if (implied) parts.push(`zapne i ${implied.label.toLowerCase()}`);
  if (action.goalPeriod === "none") parts.push("bez dlaždice");
  else {
    const period = action.goalPeriod === "week" ? "týdně" : "denně";
    parts.push(action.goalValue ? `cíl ${formatNumber(action.goalValue)} ${period}` : period);
  }
  return parts.join(" · ");
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
