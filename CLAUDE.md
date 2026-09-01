# Plínolog — poznámky pro agenta

Sdílený tracker miminka. React SPA (Vite + TS) + Vercel Functions + Neon/Drizzle.
Uživatelé jsou dva rodiče, appka se používá hlavně v noci na telefonu.

## Zásady

- **Čeština všude** — UI texty, komentáře, commit messages, chybové hlášky.
- **Časy jsou epoch milisekundy** (`bigint` v DB, `number` v TS). Žádné ISO
  stringy v datovém modelu, formátuje se až v `src/lib/format.ts`.
- **Mazání je soft delete** (`deleted` + `updatedAt`) — kvůli pozdějšímu syncu.
- **UX pro unaveného rodiče**: cíle na dotek min. 44 px, tmavý motiv jako
  výchozí, žádné vícekrokové průvodce. Nový záznam musí jít uložit na 2–3 klepnutí.
- **Funkce v `api/` musí mít `export default`** a Node signaturu `(req, res)` —
  o obojí se stará `route({ GET, POST, … })` z `api/_lib/http.ts`. Pojmenované
  exporty metod (`export const GET`) jsou konvence Next.js App Routeru a na
  Vercelu u samostatných funkcí končí na FUNCTION_INVOCATION_FAILED.
- **Relativní importy v `api/` musí mít příponu `.js`** (`./_lib/http.js`).
  Projekt je ESM (`"type": "module"`), takže Node bez přípony modul nenajde
  a funkce spadne už při načtení. TS si `.js` namapuje zpět na `.ts`.
- Uvnitř handlerů se píše proti Web API (`Request` → `Response`), převod
  na Node dělá `route()`.

## Příkazy

```bash
npm run dev        # Vite na 4321, včetně /api/* přes vite-plugin-api.ts
npm run build      # tsc -b && vite build
npm run db:push    # schéma do Neonu
npm run db:seed    # výchozí sada akcí
```

Porty 3000 a 3100 jsou na tomhle stroji obsazené — proto 4321.

## Diagnostika

`GET /api/health` řekne, které env proměnné funkce vidí (jen true/false).
Když padá všechno včetně health, problém je v nasazení funkcí, ne v konfiguraci.

## Známé TODO

- Offline režim (`TODO(offline)` v `src/lib/api.ts`, `public/sw.js`).
