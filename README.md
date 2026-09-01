# Plínolog

Sdílený deník miminka pro dva rodiče — krmení, plíny, vitamíny. React SPA (Vite +
TypeScript), API jako Vercel Functions, data v Neon Postgres.

## Jak to funguje

- **Přehled** (`/`) — dlaždice se souhrnem za dnešek / tenhle týden, pod nimi
  záznamy seskupené po dnech. Nahoře stopky krmení, vpravo dole `+` na nový záznam.
- **Správa akcí** (`/akce`) — CRUD sledovaných akcí. Akce je buď „jen se stalo"
  (kakání), nebo „s množstvím" (dokrm v ml, vitamín v kapkách). U každé se určí,
  jestli se souhrn počítá denně, týdně, nebo vůbec.
- Jeden **záznam** = jedna session: čas začátku (a volitelně konce) + odkliknuté
  akce. U záznamu se ukazuje, kdo ho pořídil.
- Akci, která přestala být aktuální, označ jako **zrušenou** — zmizí z nabídky,
  ale zůstane u historických záznamů. Mazání je až poslední možnost.

## Spuštění lokálně

```bash
cp ENV.sample .env.local   # doplň DATABASE_URL, AUTH_SECRET, INVITE_CODE
npm install
npm run db:push            # vytvoří tabulky v Neonu
npm run db:seed            # nepovinné — nasype výchozí akce
npm run dev                # http://localhost:4321
```

`npm run dev` obsluhuje i `/api/*` — soubory z `api/` běží přes plugin
`vite-plugin-api.ts` stejně jako potom na Vercelu. `vercel dev` není potřeba.

## Struktura

```
api/                  Vercel Functions (Web handlery: export const GET/POST/…)
  _lib/               schema, db, auth, http helpery
  auth/               login, register, logout, me
  action-types.ts     CRUD sledovaných akcí
  sessions.ts         CRUD záznamů
src/
  components/         UI stavebnice + dialogy
  pages/              LoginPage, DashboardPage, AdminPage
  lib/                api klient, formátování času, statistiky
  state/              auth, data, theme
drizzle/              vygenerované SQL migrace
```

## Účty

Registrace je za **zvacím kódem** (`INVITE_CODE`) — bez něj účet nevznikne.
Každý rodič má vlastní jméno a heslo, data vidí oba. Přihlášení drží 90 dní,
aby se v noci nemuselo řešit heslo.

## Deploy

Projekt na Vercelu (framework preset **Vite**), env proměnné `DATABASE_URL`,
`AUTH_SECRET`, `INVITE_CODE`. `vercel.json` posílá všechno mimo `/api/*` na
`index.html`, aby fungovaly přímé odkazy na `/akce`.

## Co zatím neumí

- **Offline zápis.** Appka je online-only; bez signálu zápis selže s hláškou.
  Místa k doplnění jsou označená `TODO(offline)` v `src/lib/api.ts` a `public/sw.js`.
  Plán: fronta v localStorage + sync přes `updatedAt` (jako v appce na kontrakce).
- Export dat (CSV/PDF).
- Grafy vývoje v čase.
