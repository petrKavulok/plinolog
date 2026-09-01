/**
 * Krátké pípnutí přes Web Audio — žádný zvukový soubor, nic se nestahuje.
 *
 * Prohlížeče nedovolí přehrát zvuk bez interakce uživatele, proto se
 * AudioContext vytvoří při klepnutí na „Začít krmení" (viz unlockAudio)
 * a při samotném zvonění už se jen probudí.
 */
let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Zavolat v obsluze kliknutí — jinak zůstane zvuk zablokovaný. */
export function unlockAudio() {
  void audioContext()?.resume();
}

/** Tři jemná pípnutí — dost na probrání, ne na vylekání miminka. */
export function playAlarm() {
  const audio = audioContext();
  if (!audio) return;
  void audio.resume();

  const start = audio.currentTime;
  for (let i = 0; i < 3; i++) {
    const at = start + i * 0.28;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, at);
    // náběh a doznění, ať to necvaká
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.22);

    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + 0.24);
  }
}

/** Zavibruje, kde to jde (Android). iOS tohle API nemá — tiše se přeskočí. */
export function vibrate() {
  navigator.vibrate?.([200, 100, 200]);
}
