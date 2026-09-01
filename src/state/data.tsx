import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ActionType, CareSession } from "../lib/types";

type DataValue = {
  actions: ActionType[];
  sessions: CareSession[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<ActionType[]>([]);
  const [sessions, setSessions] = useState<CareSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.listActionTypes(), api.listSessions(30)]);
      setActions(a.actionTypes);
      setSessions(s.sessions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se načíst data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Druhý rodič zapisuje na svém telefonu — po návratu do appky si data
  // srovnáme. (Do skutečného realtimu se pustíme, až bude potřeba.)
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  return (
    <DataContext value={{ actions, sessions, loading, error, reload }}>
      {children}
    </DataContext>
  );
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData mimo DataProvider");
  return value;
}
