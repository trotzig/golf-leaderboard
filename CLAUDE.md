# nordicgolftour.app

Unofficial website for the Cutter & Buck Tour, the Nordic professional golf tour for men. Live at [nordicgolftour.app](https://nordicgolftour.app).

## Tech Stack

- **Framework**: Next.js (Pages Router) with React 19
- **Database**: PostgreSQL via Prisma ORM
- **Deployment**: Vercel
- **Styling**: Plain CSS (`styles.css`)
- **Email**: Mailgun
- **Visual testing**: Happo (screenshot testing), Storybook

## Project Structure

```
pages/          # Next.js pages (file-based routing)
  api/          # API routes
    admin/      # Admin endpoints
    auth/       # Auth flow (passwordless email)
    cron/       # Vercel cron jobs
    favorites/  # Favorites management
src/            # Shared components and utilities
scripts/        # Data sync and maintenance scripts
prisma/         # Database schema
public/         # Static assets (player photos, etc.)
```

## Data Flow

Tournament data is fetched from the GolfBox API (`scores.golfbox.dk`) and stored in PostgreSQL. Two Vercel cron jobs run continuously:

- `/api/cron/sync-data` — hourly: fetches competitions, players, leaderboard entries, OOM standings
- `/api/cron/notify-subscribers` — every 5 minutes: sends email notifications via Mailgun

Key env vars: `DATABASE_URL`, `NEXT_PUBLIC_GOLFBOX_CUSTOMER_ID`, `NEXT_PUBLIC_GOLFBOX_OOM_ID`

## Database Models

- **Competition** — tournament (id, name, slug, venue, start/end dates, finished flag)
- **Player** — golfer (id from GolfBox MemberID, slug, name, club, OOM position)
- **LeaderboardEntry** — live position per competition per player
- **PlayerCompetitionScore** — final score after competition ends
- **Account** — subscriber (email, notification preferences)
- **Favorite** — account ↔ player many-to-many
- **SignInAttempt** — passwordless auth tokens
- **ResultNotified** — tracks which notifications have been sent (deduplication)

## Authentication

Passwordless email-based sign-in. Flow: `auth/init.js` → email with code → `auth/confirm-code.js` or `auth/confirm.js` → sets auth cookie.

## Key Scripts

- `pnpm sync-data` / `pnpm sync-data:prod` — manual data sync
- `pnpm notify-subscribers` / `notify-subscribers:prod` — manual notification run
- `pnpm db:studio` — open Prisma Studio locally
- `pnpm dev` — start dev server
- `pnpm storybook` — start Storybook on port 6006

Use `production.env` file (gitignored) for prod env vars with the `:prod` script variants. Local development benefits from copying an .env file from the workspace source/root.

## Conventions

- Components live in `src/` as `.js` files (React, no TypeScript)
- ESM modules use `.mjs` extension
- Slugs are generated from player names and deduplicated with MD5 suffix if colliding
- GolfBox API responses use JSONP format — parsed with `scripts/utils/parseJson.mjs`
- Dark mode is supported via CSS (check `styles.css` for `prefers-color-scheme`)
