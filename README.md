# PensionTracker

A self-hosted web app for manually tracking pension investment performance over time. Built for pension providers (like Aviva) that do not expose detailed performance data, allowing you to record snapshots of your portfolio and see returns over time.

## Features

- Record on-demand snapshots: per-fund values, shares held, contributions, and transfers
- Summary cards: current value, net invested, total return, and annualised return
- Year-by-year performance history with per-period drill-down
- Value chart showing portfolio growth over time
- Fund management: target allocations, ticker/ISIN storage, and opening balances
- Supports multiple pensions including closed ones with full historical data
- Authentication via username/password, with optional Microsoft Entra ID (Azure AD) SSO

## Tech Stack

- **Next.js 15** (App Router)
- **SQLite + Drizzle ORM** (Postgres also supported via env var)
- **Tailwind CSS**
- **Recharts**
- **Auth.js v5** (next-auth)
- **Docker** for deployment

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install and run

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with your settings (see [Configuration](#configuration)), then:

```bash
npm run db:migrate   # apply database migrations
npm run dev          # start dev server at http://localhost:3000
```

On first visit you will be prompted to create a username and password.

### Seed data

To populate the database with realistic test data (four pensions, varied contribution histories):

```bash
npm run db:seed
```

This creates a test user with credentials `pensiontracker` / `pensiontracker`.

## Configuration

Copy `.env.example` to `.env.local` and set the following:

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Random secret for signing JWTs. Generate with `openssl rand -base64 32`. |
| `DATABASE_TYPE` | No | `sqlite` (default) or `postgres` |
| `DATABASE_URL` | No | SQLite file path (default: `file:./data/pension.db`) or Postgres connection string |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | No | Azure app client ID (enables SSO login) |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | No | Azure app client secret |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | No | Azure tenant ID |

Azure SSO is entirely optional. If the three `AUTH_MICROSOFT_ENTRA_ID_*` variables are not set, the Azure login button will not appear.

## Docker Deployment

Build and run the container, mounting a volume to persist the SQLite database:

```bash
docker build -t pension-tracker .

docker run -d \
  -p 3000:3000 \
  -v pension-data:/app/data \
  -e AUTH_SECRET=<your-secret> \
  pension-tracker
```

Then run migrations inside the container:

```bash
docker exec <container-id> node node_modules/.bin/drizzle-kit migrate
```

## Database

### Migrations

```bash
npm run db:migrate                                    # apply pending migrations
npx drizzle-kit generate --name <migration_name>     # generate a new migration after schema changes
```

### Switching to Postgres

Set these in your environment:

```
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/pension_tracker
```

The schema and queries are compatible with both drivers.

## Development

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # run ESLint
```
