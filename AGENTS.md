# AGENTS.md

Guidance for AI agents working on the PensionTracker codebase.

## Project Overview

PensionTracker is a self-hosted Next.js 15 web application for manually tracking pension investment performance. Users record periodic snapshots of their portfolio (fund values, contributions, transfers) and the app calculates returns over time.

Key domain concepts:
- **Pension**: a top-level account (e.g. a workplace pension). Can be active or closed.
- **Fund**: a named investment within a pension (e.g. "Global Equity"). Holds ISIN, ticker, and target allocation.
- **Snapshot**: a point-in-time record of the whole pension, containing one **entry** per fund plus optional **contributions** and **transfers**.
- **Return calculations**: live in `src/lib/calculations.ts`. Annualized return uses a simple formula (not XIRR); XIRR is a future feature.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript 5 |
| Database | SQLite (default) or PostgreSQL, via Drizzle ORM 0.38 |
| Auth | Auth.js v5 (next-auth), Credentials + optional Entra ID SSO |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 2 |
| Build/Deploy | Standalone Next.js output, Docker (Node 20 Alpine) |

## Repository Layout

```
src/
  actions/      # Server actions ("use server") - all mutations live here
  app/          # Next.js App Router pages and API routes
  components/   # React components, grouped by domain
  db/           # Drizzle instance (index.ts) and schema (schema.ts)
  lib/          # Pure utilities (calculations.ts)
  types/        # Type augmentations
  auth.ts       # NextAuth initialization
  auth.config.ts  # Edge-compatible config used by middleware
  middleware.ts   # Route protection
drizzle/        # SQL migration files
scripts/        # seed.js (test data)
```

## Development Commands

```bash
npm install
npm run db:migrate    # apply pending migrations
npm run dev           # dev server on http://localhost:3000 (Turbopack)
npm run build         # production build (standalone output)
npm run lint          # ESLint
npm run db:seed       # seed test data (user: pensiontracker / pensiontracker)
```

To generate a new migration after changing `src/db/schema.ts`:
```bash
npx drizzle-kit generate --name <migration_name>
```

There is no automated test suite. Verify changes by running the app and exercising the relevant flows manually.

## Code Conventions

- **Server actions for all mutations.** Pages and components never write to the database directly. Add new mutations in `src/actions/`.
- **Server components by default.** Only drop to `"use client"` when interactivity requires it (forms, chart wrappers, buttons with client state).
- **Authorization in every action.** Every server action must call `requireAuth()` (and ownership checks where appropriate) before touching the database.
- **Database transactions for multi-table writes.** Snapshot creation (entries + contributions) must stay in a single transaction.
- **No ORM magic outside `src/db/`.** Keep Drizzle queries inside actions or dedicated query helpers; do not scatter raw Drizzle calls into components.
- **Tailwind for all styling.** No CSS modules except `globals.css`. No external component libraries.
- **GBP currency throughout.** Format monetary values consistently with the existing helpers.

## Database

`src/db/schema.ts` is the single source of truth. The schema has:

```
users
pensions  (belongs to user)
funds     (belongs to pension)
snapshots (belongs to pension)
snapshotEntries (belongs to snapshot + fund)
contributions   (belongs to snapshot)
```

Cascading deletes are defined at the schema level (pension delete removes funds, snapshots, entries, contributions). Do not replicate this logic in application code.

When adding a column, write a new migration file in `drizzle/` following the existing naming convention and update `schema.ts` to match.

## Authentication

`src/auth.config.ts` is edge-compatible and used by the middleware. It must not import Node.js APIs or Drizzle.

`src/auth.ts` is the full NextAuth instance and can use Node APIs.

Entra ID SSO is optional and feature-flagged via environment variables (`ENTRA_CLIENT_ID`, etc.). When it is not configured the Credentials provider is the only option.

## Environment Variables

See `.env.example` for the full list. The critical ones:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | NextAuth JWT signing secret (required) |
| `DATABASE_TYPE` | `sqlite` (default) or `postgres` |
| `DATABASE_URL` | Required only when `DATABASE_TYPE=postgres` |

## Known Deferred Work

See `TODO.md` for the full roadmap. Two items that affect how you should approach related work:

- **XIRR**: annualized return currently uses a simple formula in `src/lib/calculations.ts`. Do not implement XIRR without first discussing the approach, as it requires time-series cash flow data that is not yet exposed in the right shape.
- **Rate limiting on login**: there is no brute-force protection on the credentials login endpoint. This is deferred pending an external store (e.g. Upstash Redis). Do not add in-memory rate limiting as a substitute.

## What to Avoid

- Do not change the database dialect in code; use the `DATABASE_TYPE` env var.
- Do not add client-side state management libraries (Redux, Zustand, etc.); the app relies on server state and Next.js cache revalidation.
- Do not expose raw database errors to the client; return typed error objects from server actions.
- Do not add AI/LLM calls to this codebase without an explicit request to do so.
