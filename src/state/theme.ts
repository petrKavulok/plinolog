import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "plinolog:theme";

/** Výchozí je tmavý motiv — appka se používá hlavně v noci. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme | null) ?? "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#fdf7f9" : "#14121a");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );
  return { theme, toggle };
}
