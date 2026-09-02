import { useEffect, useState } from "react";
import type { ActionType, ActionTypeInput } from "../lib/types";
import { Button, ErrorNote, Field, Modal, inputClass } from "./ui";

/** Rychlá nabídka — ať se nemusí lovit v systémové klávesnici. */
const EMOJI = [
  "🍼", "🤱", "💩", "💧", "🧷", "💊", "🩹", "😴",
  "🛁", "🌡️", "⚖️", "🤢", "🚼", "🧴", "🦷", "☀️",
];

const EMPTY: ActionTypeInput = {
  label: "",
  emoji: "🍼",
  kind: "event",
  unit: null,
  presets: [],
  defaultValue: null,
  goalPeriod: "day",
  goalValue: null,
  weighing: false,
  timed: false,
  impliesActionId: null,
  sortOrder: 0,
  archived: false,
};

export function ActionForm({
  open,
  onClose,
  onSubmit,
  editing,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ActionTypeInput) => Promise<void>;
  editing: ActionType | null;
  /** ostatní akce — pro volbu navázané akce */
  actions: ActionType[];
}) {
  const [form, setForm] = useState<ActionTypeInput>(EMPTY);
  const [presetsText, setPresetsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const base = editing ? { ...editing } : EMPTY;
    setForm(base);
    setPresetsText(base.presets.join(", "));
  }, [open, editing]);

  const set = <K extends keyof ActionTypeInput>(key: K, value: ActionTypeInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit() {
    if (!form.label.trim()) {
      setError("Napiš název akce.");
      return;
    }
    const presets = presetsText
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 6);

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...form,
        label: form.label.trim(),
        unit: form.kind === "quantity" ? (form.unit?.trim() || null) : null,
        presets: form.kind === "quantity" ? presets : [],
        defaultValue: form.kind === "quantity" ? (form.defaultValue ?? presets[0] ?? 0) : null,
        goalValue: form.goalPeriod === "none" ? null : form.goalValue,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení selhalo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Upravit akci" : "Nová akce"}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Ikona">
          <div className="flex flex-wrap gap-1.5">
            {EMOJI.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => set("emoji", emoji)}
                aria-label={`Ikona ${emoji}`}
                aria-pressed={form.emoji === emoji}
                className={`flex size-11 items-center justify-center rounded-2xl text-2xl transition ${
                  form.emoji === emoji ? "bg-accent/20 ring-2 ring-accent" : "bg-surface-2"
                }`}
              >
                {emoji}
              </button>
            ))}
            <input
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value.slice(0, 8))}
              aria-label="Vlastní ikona"
              className="size-11 rounded-2xl border border-line bg-surface-2 text-center text-2xl outline-none focus:border-accent"
            />
          </div>
        </Field>

        <Field label="Název">
          <input
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Kakání"
            className={inputClass}
          />
        </Field>

        <Field label="Typ" hint="Zadává se u téhle akce množství?">
          <div className="grid grid-cols-2 gap-2">
            <Choice
              active={form.kind === "event"}
              onClick={() => set("kind", "event")}
              title="Jen se stalo"
              subtitle="kakání, přebalení"
            />
            <Choice
              active={form.kind === "quantity"}
              onClick={() => set("kind", "quantity")}
              title="S množstvím"
              subtitle="dokrm, kapky"
            />
          </div>
        </Field>

        {form.kind === "quantity" && (
          <div className="animate-fade flex flex-col gap-4 rounded-2xl bg-surface-2 p-3">
            <Field label="Jednotka">
              <input
                value={form.unit ?? ""}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="ml"
                className={inputClass}
              />
            </Field>
            <Field label="Rychlé předvolby" hint="Čísla oddělená čárkou, max 6.">
              <input
                value={presetsText}
                onChange={(e) => setPresetsText(e.target.value)}
                placeholder="40, 60, 80"
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <Field label="Souhrn na dashboardu">
          <div className="grid grid-cols-3 gap-2">
            <Choice
              active={form.goalPeriod === "day"}
              onClick={() => set("goalPeriod", "day")}
              title="Denně"
            />
            <Choice
              active={form.goalPeriod === "week"}
              onClick={() => set("goalPeriod", "week")}
              title="Týdně"
            />
            <Choice
              active={form.goalPeriod === "none"}
              onClick={() => set("goalPeriod", "none")}
              title="Neukazovat"
            />
          </div>
        </Field>

        {form.goalPeriod !== "none" && (
          <Field
            label="Cíl za období"
            hint={
              form.kind === "quantity"
                ? "Nepovinné. Porovnává se součet (např. 500 ml denně)."
                : "Nepovinné. Porovnává se počet (např. 2 kapky týdně)."
            }
          >
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={form.goalValue ?? ""}
              onChange={(e) =>
                set("goalValue", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="bez cíle"
              className={inputClass}
            />
          </Field>
        )}

        <label className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            checked={form.timed}
            onChange={(e) => set("timed", e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          <span className="flex flex-col">
            <span className="font-medium">Měří se stopkami</span>
            <span className="text-xs text-muted">
              Tlačítko stopek na přehledu bude patřit téhle akci a po „Hotovo"
              se rovnou předvybere.
            </span>
          </span>
        </label>

        <Field
          label="Zapnout s ní také"
          hint="Třeba u čůrání a kakání se hodí přebalení — zaškrtne se samo."
        >
          <select
            value={form.impliesActionId ?? ""}
            onChange={(e) => set("impliesActionId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">nic</option>
            {actions
              .filter((a) => a.id !== editing?.id && !a.archived)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.label}
                </option>
              ))}
          </select>
        </Field>

        <label className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            checked={form.weighing}
            onChange={(e) => set("weighing", e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          <span className="flex flex-col">
            <span className="font-medium">Vážení před a po</span>
            <span className="text-xs text-muted">
              Nabídne zadání váhy miminka před a po. Rozdíl v gramech odpovídá
              vypitému množství.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            checked={form.archived}
            onChange={(e) => set("archived", e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
          <span className="flex flex-col">
            <span className="font-medium">Zrušená</span>
            <span className="text-xs text-muted">
              Zůstane u starých záznamů, ale nenabízí se u nových.
            </span>
          </span>
        </label>

        <ErrorNote>{error}</ErrorNote>

        <Button size="lg" onClick={submit} disabled={saving} className="w-full">
          {saving ? "Ukládám…" : "Uložit akci"}
        </Button>
      </div>
    </Modal>
  );
}

function Choice({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border px-2 text-center transition ${
        active ? "border-accent bg-accent/10 text-ink" : "border-line bg-surface-2 text-muted"
      }`}
    >
      <span className="text-sm font-semibold">{title}</span>
      {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
    </button>
  );
}
