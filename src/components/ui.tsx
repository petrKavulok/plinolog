import { useEffect, useRef, type ReactNode } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "surface";
  size?: "md" | "lg";
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong active:scale-[0.98]",
  surface: "bg-surface-2 text-ink border border-line hover:border-accent active:scale-[0.98]",
  ghost: "text-muted hover:text-ink",
  danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  // min-h-11 = pohodlný cíl pro palec i v polospánku
  const sizing = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-11 px-4 text-base";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-line bg-surface p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-base text-ink outline-none placeholder:text-muted focus:border-accent";

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // klik mimo panel (na backdrop) zavře dialog
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[100dvh] w-full max-w-full bg-transparent p-0 backdrop:bg-black/60 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-lg"
    >
      <div className="animate-pop safe-bottom flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-line bg-surface text-ink sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-2xl text-muted hover:text-ink"
          >
            ×
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}

/** Dialog je připnutý dole na mobilu — typický "bottom sheet". */
export function Spinner({ label = "Načítám…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      {label}
    </div>
  );
}
