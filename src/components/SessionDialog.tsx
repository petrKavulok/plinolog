import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatDuration, fromLocalInput, toLocalInput } from "../lib/format";
import type { ActionType, CareSession, SessionEntry } from "../lib/types";
import { Button, ErrorNote, Field, Modal, inputClass } from "./ui";
import { ActionBadge, type PickedEntry } from "./ActionBadge";

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
  /** váha zadaná před krmením u stopek, v gramech */
  initialWeightBefore?: number | null;
};

export function SessionDialog({
  open,
  onClose,
  onSaved,
  actions,
  editing = null,
  initialStartedAt,
  initialEndedAt,
  initialWeightBefore,
}: Props) {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<string, PickedEntry>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vstupy držíme v refu, ať reset závisí jen na otevření dialogu. Kdyby
  // v závislostech bylo `actions`, obnovení dat na pozadí (návrat do appky)
  // by rodiči vymazalo rozdělaný záznam.
  const latest = useRef({ actions, editing, initialStartedAt, initialEndedAt, initialWeightBefore });
  latest.current = { actions, editing, initialStartedAt, initialEndedAt, initialWeightBefore };

  // Při otevření dialog vždy naplníme čerstvými daty.
  useEffect(() => {
    if (!open) return;
    const { actions, editing, initialStartedAt, initialEndedAt, initialWeightBefore } =
      latest.current;

    setError(null);
    setStartedAt(editing?.startedAt ?? initialStartedAt ?? Date.now());
    setEndedAt(editing?.endedAt ?? initialEndedAt ?? null);
    setNote(editing?.note ?? "");
    if (editing) {
      setPicked(
        Object.fromEntries(
          editing.entries.map((e) => [
            e.actionTypeId,
            { value: e.value, weightBefore: e.weightBefore, weightAfter: e.weightAfter },
          ]),
        ),
      );
      return;
    }
    // Když se u stopek zadala váha před, rovnou aktivujeme akci s vážením —
    // rodič vážil, takže krmení evidentně proběhlo.
    const weighed = actions.find((a) => a.weighing && !a.archived);
    setPicked(
      initialWeightBefore != null && weighed
        ? {
            [weighed.id]: {
              value: weighed.kind === "quantity" ? (weighed.defaultValue ?? 0) : null,
              weightBefore: initialWeightBefore,
              weightAfter: null,
            },
          }
        : {},
    );
  }, [open]);

  // Zrušené akce nabízíme jen tehdy, když u tohohle záznamu už jsou.
  const available = actions.filter((a) => !a.archived || a.id in picked);

  const toggle = (action: ActionType) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (action.id in next) {
        // Vypnutí navázanou akci nechává být — plínu jsi možná vyměnil
        // z jiného důvodu a nechceme mazat, co rodič sám naklikal.
        delete next[action.id];
        return next;
      }

      // Zapnutí zapne i navázané akce (čůrání → přebalení). Řetěz sledujeme
      // dál, `seen` chrání před zacyklením přes cizí konfiguraci.
      const seen = new Set<string>();
      let current: ActionType | undefined = action;
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        if (!(current.id in next)) {
          next[current.id] = {
            value: current.kind === "quantity" ? (current.defaultValue ?? 0) : null,
            weightBefore: null,
            weightAfter: null,
          };
        }
        const nextId: string | null = current.impliesActionId;
        current = nextId ? actions.find((a) => a.id === nextId) : undefined;
      }
      return next;
    });

  const patch = (actionId: string, values: Partial<PickedEntry>) =>
    setPicked((prev) => ({ ...prev, [actionId]: { ...prev[actionId], ...values } }));

  async function save() {
    const entries: SessionEntry[] = Object.entries(picked).map(([actionTypeId, e]) => ({
      actionTypeId,
      value: e.value,
      weightBefore: e.weightBefore,
      weightAfter: e.weightAfter,
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
              entry={picked[action.id] ?? null}
              onToggle={() => toggle(action)}
              onChange={(values) => patch(action.id, values)}
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
