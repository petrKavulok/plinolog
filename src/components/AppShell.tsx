import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useTheme } from "../state/theme";

export function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-2 bg-bg/85 py-3 backdrop-blur">
        <span aria-hidden className="text-2xl">
          🧷
        </span>
        <h1 className="flex-1 text-xl font-bold">Plínolog</h1>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Světlý motiv" : "Tmavý motiv"}
          className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="min-h-10 rounded-full px-3 text-sm text-muted hover:bg-surface-2 hover:text-ink"
        >
          {user?.displayName} · odhlásit
        </button>
      </header>

      <nav className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1">
        <Tab to="/">Přehled</Tab>
        <Tab to="/akce">Správa akcí</Tab>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
          isActive ? "bg-surface text-ink shadow-sm" : "text-muted"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
