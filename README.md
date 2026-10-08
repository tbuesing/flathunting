# Flathunting Sydney

Vergleichsliste für Zimmerangebote in Sydney: Link oder Inseratstext einfügen → Claude füllt die Spalten vor → in der Tabelle korrigieren, gewichten, vergleichen.

**Stack (wie Storyteller):** Next.js 16 · Neon Postgres + Drizzle · Claude Haiku über AI SDK · Vercel. Kein Login, nur ein gemeinsames Passwort (`APP_PASSWORD`).

**Kriterien** (`src/lib/criteria.ts`): Zimmer · max. 450 AUD/Woche · ab sofort (Einzug ≤ 14 Tage). Verstöße werden ausgegraut.

## Setup

1. Repo zu GitHub pushen und in Vercel importieren.
2. In Vercel: Neon über den Marketplace verbinden (setzt `DATABASE_URL`), `ANTHROPIC_API_KEY` und `APP_PASSWORD` als Env-Variablen setzen.
3. Lokal:
   ```bash
   bun install
   vercel env pull .env.local
   bun run db:push
   bun run dev
   ```

## Dateien

| Datei | Zweck |
|---|---|
| `src/db/schema.ts` | Tabelle `listings` |
| `src/lib/extract.ts` | Seite laden / Text → Claude → Felder |
| `src/lib/criteria.ts` | harte Kriterien, Score, Standardgewichte |
| `src/components/listings-table.tsx` | Excel-artige Tabelle |
| `src/app/api/listings` | GET/POST, PATCH/DELETE pro Zeile |
| `src/proxy.ts`, `src/app/api/login` | Passwortschutz |

Plattformen mit Bot-Schutz (z. B. realestate.com.au, Facebook) liefern beim Abruf oft nichts – dann den Inseratstext ins zweite Feld kopieren.
