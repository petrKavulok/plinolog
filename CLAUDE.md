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
- API handlery jsou Web standard (`export const GET = route(async (req) => …)`),
  ne Node `(req, res)`. `route()` z `api/_lib/http.ts` řeší chyby a JSON.

## Příkazy

```bash
npm run dev        # Vite na 4321, včetně /api/* přes vite-plugin-api.ts
npm run build      # tsc -b && vite build
npm run db:push    # schéma do Neonu
npm run db:seed    # výchozí sada akcí
```

Porty 3000 a 3100 jsou na tomhle stroji obsazené — proto 4321.

## Známé TODO

- Offline režim (`TODO(offline)` v `src/lib/api.ts`, `public/sw.js`).
