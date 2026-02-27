# Habit Pilot

Habit Pilot is a web app for planning and tracking habits with a weekly capacity model (`CU` units).
You define habits, distribute them across the week, track daily execution, and analyze progress over time.

## What the app does

- Authentication with JWT cookie sessions (`/login`, `/register`, `/logout`)
- Habit management: create, edit, disable, and delete habits
- Weekly planning board with drag-and-drop style scheduling logic
- Daily execution flow (`/today`) with status updates and recovery suggestions
- Progress analytics (`/progress`) with charts and range presets
- Basic onboarding flow (set capacity -> add first habit -> plan week)
- Light/Dark theme support

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Radix UI primitives
- Drizzle ORM
- Cloudflare D1 (SQLite-compatible), local D1 emulator for development
- OpenNext for Cloudflare deployment

## Project structure

- `app/(landing)` -> public landing page
- `app/(auth)` -> auth pages
- `app/(app)` -> protected application pages (`today`, `plan`, `habits`, `progress`, `settings`)
- `app/api/*` -> API routes for auth, user, habits, plan, progress, today
- `lib/*` -> domain logic (auth, db, planning, progress, onboarding)
- `drizzle/*` -> schema and migrations

## Environment variables

Create local env file:

```bash
cp .env.example .env
```

Required:

- `JWT_SECRET` -> secret for signing/verifying JWTs (use a random value, 32+ chars)

Common local/dev values:

- `PORT=3000`
- `CF_REMOTE_BINDINGS=false` -> use local D1 emulator bindings
- `D1_DATABASE_NAME=habit-pilot`

Only for remote Cloudflare D1 (`CF_REMOTE_BINDINGS=true`):

- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_TOKEN`

## Run locally

1. Install dependencies:

```bash
pnpm install
```

2. Start dev server:

```bash
pnpm dev
```

3. Open `http://localhost:3000`

Useful commands:

- `pnpm lint` -> run ESLint
- `pnpm test` -> run unit tests
- `pnpm db:generate` -> generate migrations
- `pnpm db:migrate` -> apply migrations
- `pnpm db:studio` -> open Drizzle Studio

## Run with Docker

```bash
docker compose up --build
```

Notes:

- App is available at `http://localhost:3000`
- Local DB state is persisted in `./.wrangler/state`
- Migrations are applied on container startup (`docker/start-app.sh`)

Watch mode:

```bash
docker compose up --build --watch
```

## Deployment (Cloudflare)

- `pnpm cf:build` -> build for Cloudflare via OpenNext
- `pnpm cf:deploy` -> build + deploy
- `pnpm cf:deploy-only` -> deploy already built output

Before deployment, configure Cloudflare env and D1 bindings.
