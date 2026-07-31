# Job Application Tracker

A lightweight, single-user web app for tracking job applications end to end — status pipeline, dates at every stage, salary/day-rate and IR35 status, CV/cover-letter usage, file attachments, reminders, and a dashboard of stats.

Built as a personal tool, not a multi-tenant product: there's no auth, no user accounts, and no plans to add either.

## Features

- **Kanban board** with drag-and-drop status changes and manual within-column reordering (sorted oldest-applied-first by default)
- **List view** with filters by source, status, and date-added range
- **Dashboard** — applications by source/status, response rate, average time in stage
- **Status timeline** per application — every status change is logged with a timestamp, optional stage label (e.g. "Stage 2 — Technical"), and notes; statuses can be logged in any order, since real pipelines go sideways
- **Salary / day rate** — permanent roles record a salary range; contract roles record a day rate and IR35 status instead
- **CV & cover-letter tracking** — mark whether a tailored CV/cover letter was used, plus free-form file attachments (CV, cover letter, or other documents) per application
- **Reminders** with an upcoming-reminders widget
- **Light / dark / system theme toggle**

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components & Server Actions)
- [React 19](https://react.dev/)
- [Prisma 7](https://www.prisma.io/) ORM + PostgreSQL (via `@prisma/adapter-pg`)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [@dnd-kit](https://dndkit.com/) for drag-and-drop
- Docker / Docker Compose for deployment

## Project structure

```
prisma/                 Schema, migrations, seed script
src/app/                Routes (App Router) — board, list, dashboard, application CRUD, file API
src/components/          UI components, incl. the board, forms, and attachments/reminders sections
src/lib/                 Server Actions, queries, and non-UI logic, grouped by domain
src/generated/prisma/    Generated Prisma client (gitignored, created by `prisma generate`)
uploads/                 Uploaded attachment files (gitignored; a named volume in Docker)
```

## Getting started

### Prerequisites

- Node.js 22+
- Docker (for Postgres — and optionally to run the whole app)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Two separate env files are used, deliberately kept apart so `docker compose` (which reads `.env` automatically) can't collide with the app's own `DATABASE_URL`:

```bash
cp .env.docker.example .env.docker   # sets the Postgres user/password/db
cp .env.example .env                 # DATABASE_URL for `npm run dev` — must use the same password as .env.docker
```

Edit both files and set a real `POSTGRES_PASSWORD` / matching `DATABASE_URL` password (the checked-in examples use a placeholder).

### 3. Start Postgres

```bash
docker compose --env-file .env.docker up -d db
```

This runs Postgres on host port `5433` (not the default `5432`, to avoid clashing with other local Postgres instances — change the mapping in `docker-compose.yml` if you don't need that).

### 4. Apply migrations and seed (optional)

```bash
npx prisma migrate deploy
npm run db:seed   # optional — see prisma/seed.ts
```

### 5. Run the dev server

```bash
npm run dev
```

By default this serves on `http://localhost:3000` (pass `-- --port <n>` to use a different one).

## Running the whole app in Docker

To run the app itself in a container too (not just Postgres), instead of steps 3–5 above:

```bash
docker compose --env-file .env.docker up -d --build
```

This builds the app image (`Dockerfile`), starts both `db` and `app`, and applies pending migrations automatically on container boot (`prisma migrate deploy` runs before `next start`, see the Dockerfile's `CMD`). The app is published on host port `3001` (see `docker-compose.yml` — again chosen to avoid clashing with other local projects; change if you don't need that).

Uploaded files are stored in the `uploads` named Docker volume, separate from the host-filesystem `uploads/` directory used by `npm run dev`.

To rebuild after pulling new code:

```bash
docker compose --env-file .env.docker up -d --build app
```

## Environment variables

| File | Variable | Used by |
| --- | --- | --- |
| `.env` | `DATABASE_URL` | `npm run dev`, Prisma CLI |
| `.env.docker` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `docker compose` (both `db` and `app` services) |

See `.env.example` and `.env.docker.example` for the expected shape.

## Data model

Core entities (see `prisma/schema.prisma` for the full picture):

- **Company** — has many Applications
- **Application** — job title, source, employment type (permanent/contract), salary range or day rate + IR35 status, current status (denormalized from its latest StatusEvent), board position
- **StatusEvent** — one row per status change, with a timestamp, optional stage label, and notes — the source of truth for the timeline
- **Contact** — recruiter/hiring-manager contacts per application
- **Reminder** — a due date, description, and done flag
- **Attachment** — uploaded files (CV, cover letter, or other), stored on disk and keyed by a generated filename distinct from the original

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start the production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Run `prisma/seed.ts` |
