import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Spinner } from "./components/ui";
import "./index.css";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./state/auth";
import { DataProvider } from "./state/data";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="Přihlašuju…" />;
  if (!user) return <LoginPage />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="akce" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Service worker jen kvůli instalovatelnosti PWA (offline zápis zatím neumíme).
// V devu ho neregistrujeme, aby nekešoval rozpracované soubory.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
