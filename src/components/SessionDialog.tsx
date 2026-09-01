import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDuration, fromLocalInput, toLocalInput } from "../lib/format";
import type { ActionType, CareSession, SessionEntry } from "../lib/types";
import { Button, ErrorNote, Field, Modal, inputClass } from "./ui";
import { ActionBadge } from "./ActionBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  actions: ActionType[];
  /** vyplněné = úprava existujícího záznamu */
  editing?: CareSession | null;
  /** předvyplněný začátek (běžící stopky) */
  initialStartedAt?: number;
  initialEndedAt?: number | null;
};

export function SessionDialog({
  open,
  onClose,
  onSaved,
  actions,
  editing = null,
  initialStartedAt,
  initialEndedAt,
}: Props) {
  const [startedAt, setStartedAt] = useState(Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<string, number | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Při otevření dialog vždy naplníme čerstvými daty.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setStartedAt(editing?.startedAt ?? initialStartedAt ?? Date.now());
    setEndedAt(editing?.endedAt ?? initialEndedAt ?? null);
    setNote(editing?.note ?? "");
    setPicked(
      Object.fromEntries(
        (editing?.entries ?? []).map((e) => [e.actionTypeId, e.value]),
      ),
    );
  }, [open, editing, initialStartedAt, initialEndedAt]);

  // Zrušené akce nabízíme jen tehdy, když u tohohle záznamu už jsou.
  const available = actions.filter((a) => !a.archived || a.id in picked);

  const toggle = (action: ActionType) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (action.id in next) delete next[action.id];
      else next[action.id] = action.kind === "quantity" ? (action.defaultValue ?? 0) : null;
      return next;
    });

  async function save() {
    const entries: SessionEntry[] = Object.entries(picked).map(([actionTypeId, value]) => ({
      actionTypeId,
      value,
    }));
    if (entries.length === 0) {
      setError("Vyber aspoň jednu akci.");
      return;
    }
    if (endedAt !== null && endedAt < startedAt) {
      setError("Konec nemůže být dřív než začátek.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { startedAt, endedAt, note: note.trim() || null, entries };
      if (editing) await api.updateSession(editing.id, payload);
      else await api.createSession(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení selhalo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Upravit záznam" : "Nový záznam"}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-col gap-2">
          {available.map((action) => (
            <ActionBadge
              key={action.id}
              action={action}
              active={action.id in picked}
              value={picked[action.id] ?? null}
              onToggle={() => toggle(action)}
              onValueChange={(value) =>
                setPicked((prev) => ({ ...prev, [action.id]: value }))
              }
            />
          ))}
          {available.length === 0 && (
            <p className="rounded-2xl bg-surface-2 px-4 py-6 text-center text-sm text-muted">
              Zatím nemáš žádné akce. Přidej si je ve Správě akcí.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Začátek">
            <input
              type="datetime-local"
              value={toLocalInput(startedAt)}
              onChange={(e) => setStartedAt(fromLocalInput(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Konec">
            <input
              type="datetime-local"
              value={endedAt === null ? "" : toLocalInput(endedAt)}
              onChange={(e) =>
                setEndedAt(e.target.value ? fromLocalInput(e.target.value) : null)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="surface" onClick={() => setStartedAt(Date.now())}>
            Začátek = teď
          </Button>
          <Button variant="surface" onClick={() => setEndedAt(Date.now())}>
            Konec = teď
          </Button>
          {endedAt !== null && (
            <span className="flex items-center px-2 text-sm text-muted">
              trvalo {formatDuration(startedAt, endedAt)}
            </span>
          )}
        </div>

        <Field label="Poznámka" hint="Nepovinné — třeba „hodně ublinkla“.">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button size="lg" onClick={save} disabled={saving} className="w-full">
          {saving ? "Ukládám…" : "Uložit záznam"}
        </Button>
      </div>
    </Modal>
  );
}
