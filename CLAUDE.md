# nordicgolftour.app

Unofficial website for the Cutter & Buck Tour, the Nordic professional golf tour for men. Live at [nordicgolftour.app](https://nordicgolftour.app).

## Always start from a fresh `main` in a local worktree

Before making any changes, make sure you're working in a local git worktree
based on the latest `origin/main`. Never work directly in the main checkout,
and never build on a stale local `main`.

```bash
git fetch origin main
git worktree add -b <branch-name> <path-to-worktree> origin/main
cd <path-to-worktree>
```

If you're already in a worktree created for this task (e.g. under
`.claude/worktrees/`), bring it up to date before starting instead:

```bash
git fetch origin main
git rebase origin/main
```

Worktrees don't share untracked files, so copy an `.env` file from the main
checkout into the worktree if you need to run the app locally.

## Tech Stack

- **Framework**: Next.js (Pages Router) with React 19
- **Database**: PostgreSQL via Prisma ORM
- **Deployment**: Vercel
- **Styling**: Plain CSS (`styles.css`)
- **Email**: Mailgun
- **Visual testing**: Merrykat (screenshot testing of Storybook stories)

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
- `pnpm test` — run unit tests (Node built-in test runner, no install needed)

Use `production.env` file (gitignored) for prod env vars with the `:prod` script variants. Local development benefits from copying an .env file from the workspace source/root.

## Conventions

- Components live in `src/` as `.js` files (React, no TypeScript)
- Page components live in `src/*Page.js`; files in `pages/` re-export them and add `getServerSideProps`. This keeps Prisma and `fs` out of Storybook, where every page has stories in `src/stories/`
- ESM modules use `.mjs` extension
- Unit-testable pure logic lives in `*.mjs` files alongside components; test files are `*.test.mjs` and run with the Node built-in test runner (`node --test`)
- Slugs are generated from player names and deduplicated with MD5 suffix if colliding
- GolfBox API responses use JSONP format — parsed with `scripts/utils/parseJson.mjs`
- Dark mode is supported via CSS (check `styles.css` for `prefers-color-scheme`)
