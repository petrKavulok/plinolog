import { useEffect } from "react";

/**
 * Drží displej rozsvícený, dokud je `active`. Používáme při běžících
 * stopkách — jinak telefon zhasne, systém uspí časovače a zvonění
 * po 15 minutách se nepřehraje.
 *
 * Zámek systém sám zruší při přepnutí na jinou appku, proto ho po
 * návratu na popředí bereme znovu. Kde API není (starší Safari), se
 * tiše nic nestane.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (released || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Odmítnutí (baterie, zásady prohlížeče) není chyba, kterou řešit.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release();
    };
  }, [active]);
}
