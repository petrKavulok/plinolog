import { useState } from "react";
import { Button, ErrorNote, Field, inputClass } from "../components/ui";
import { api } from "../lib/api";
import { useAuth } from "../state/auth";

export function LoginPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "login"
          ? await api.login(username, password)
          : await api.register({ username, displayName, password, inviteCode });
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Přihlášení selhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <p aria-hidden className="text-5xl">
          🧷
        </p>
        <h1 className="mt-2 text-3xl font-bold">Plínolog</h1>
        <p className="text-muted">Krmení, plíny a vitamíny na jednom místě.</p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Přihlašovací jméno">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
            className={inputClass}
          />
        </Field>

        {mode === "register" && (
          <Field label="Jméno u záznamů" hint="Uvidí ho druhý rodič, např. „Táta“.">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Heslo">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            className={inputClass}
          />
        </Field>

        {mode === "register" && (
          <Field label="Zvací kód" hint="Bez něj se nový účet nezaloží.">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
        )}

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? "Moment…" : mode === "login" ? "Přihlásit se" : "Založit účet"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        {mode === "login" ? "Nemám účet — chci se zaregistrovat" : "Už mám účet"}
      </button>
    </main>
  );
}
