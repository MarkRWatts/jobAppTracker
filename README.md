# Job Application Tracker

A lightweight, multi-user web app for tracking job applications end to end — status pipeline, dates at every stage, salary/day-rate and IR35 status, CV/cover-letter usage, file attachments, reminders, and a dashboard of stats.

Sign in with Google; every user's applications, companies, and uploaded files are private to their own account.

## Features

- **Kanban board** with drag-and-drop status changes and manual within-column reordering (sorted oldest-applied-first by default)
- **List view** with filters by source, status, and date-added range
- **Dashboard** — applications by source/status, response rate, average time in stage
- **Status timeline** per application — every status change is logged with a timestamp, optional stage label (e.g. "Stage 2 — Technical"), and notes; statuses can be logged in any order, since real pipelines go sideways
- **Salary / day rate** — permanent roles record a salary range; contract roles record a day rate and IR35 status instead
- **CV & cover-letter tracking** — mark whether a tailored CV/cover letter was used, plus free-form file attachments (CV, cover letter, or other documents) per application
- **Reminders** with an upcoming-reminders widget
- **Sign in with Google** — each user's data (applications, companies, uploaded files) is scoped to their own account

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components & Server Actions)
- [React 19](https://react.dev/)
- [Prisma 7](https://www.prisma.io/) ORM + PostgreSQL (via `@prisma/adapter-pg`)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [@dnd-kit](https://dndkit.com/) for drag-and-drop
- [Auth.js v5](https://authjs.dev/) (`next-auth`) + `@auth/prisma-adapter`, database sessions, Google as the only provider
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

Both files also need Google OAuth credentials — see [Authentication setup](#authentication-setup) below.

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

## Production deployment

The app also runs on a TrueNAS-hosted Ubuntu VM, behind a Caddy reverse proxy with a real Let's Encrypt certificate (DNS-01 via acme-dns) — see [DEPLOYMENT.md](DEPLOYMENT.md) for the full setup, including why plain HTTP stops being an option once you're off `localhost`.

## Environment variables

| File | Variable | Used by |
| --- | --- | --- |
| `.env` | `DATABASE_URL` | `npm run dev`, Prisma CLI |
| `.env` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL` | `npm run dev` (Auth.js) |
| `.env.docker` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `docker compose` (both `db` and `app` services) |
| `.env.docker` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL` | `docker compose` (`app` service) |

See `.env.example` and `.env.docker.example` for the expected shape.

## Authentication setup

Sign-in is Google-only, via [Auth.js](https://authjs.dev/). Setup is free and needs no HTTPS/tunnel for local use, since Google explicitly permits plain `http://localhost` redirect URIs:

1. In [Google Cloud Console](https://console.cloud.google.com), create (or select) a project.
2. **APIs & Services → OAuth consent screen** — User type: External. Fill in an app name and support/contact email. Leave scopes at the defaults (`email`, `profile`, `openid`). Add yourself (and any other testers) under **Test users**. Leave the publishing status as **Testing** — this skips Google's app-review process and supports up to 100 users, which is enough for personal/small-group use.
3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID** — Application type: Web application. Add authorized redirect URIs for however you run this:
   - `http://localhost:3000/api/auth/callback/google` (`npm run dev`)
   - `http://localhost:3001/api/auth/callback/google` (Docker)
4. Copy the generated **Client ID**/**Client Secret** into `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` in both `.env` and `.env.docker`.
5. Generate `AUTH_SECRET` (Auth.js's own cookie-encryption key, unrelated to Google): `openssl rand -base64 32`.

A reverse proxy + real HTTPS domain is only needed if this is ever exposed beyond `localhost` — not required for local use.

`Company.userId`/`Application.userId` are `NOT NULL` — every row always belongs to a real, signed-in user.

## Data model

Core entities (see `prisma/schema.prisma` for the full picture):

- **User** — an authenticated account (via Google); owns Companies and Applications. `Account`/`Session`/`VerificationToken` are Auth.js's own bookkeeping tables (`@auth/prisma-adapter`'s contract), not used directly by app code.
- **Company** — belongs to a User; has many Applications
- **Application** — belongs to a User; job title, source, employment type (permanent/contract), salary range or day rate + IR35 status, current status (denormalized from its latest StatusEvent), board position
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
