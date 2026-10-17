# duckfind-backend

Express 5 + TypeScript API, using Drizzle ORM on PostgreSQL.

## Setup

```sh
npm install
cp .env.example .env
npm run db:up        # starts Postgres in Docker on :5432
npm run dev          # http://localhost:3000/api/health
```

## Scripts

| Script                            | What it does                                       |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | Run with reload on change (tsx)                    |
| `npm run build` / `npm start`     | Compile to `dist/` and run it                      |
| `npm test`                        | Vitest + supertest                                 |
| `npm run typecheck`               | Type-check everything, including tests             |
| `npm run lint` / `npm run format` | ESLint / Prettier                                  |
| `npm run db:up` / `db:down`       | Start / stop the local Postgres container          |
| `npm run db:generate`             | Create a SQL migration in `drizzle/` from schema   |
| `npm run db:migrate`              | Apply pending migrations                           |
| `npm run db:push`                 | Sync schema straight to the DB (quick prototyping) |
| `npm run db:studio`               | Open Drizzle Studio                                |

## Layout

```
src/
  index.ts       Express app entry
  routes/
  controllers/
  models/        Drizzle table definitions (drizzle-kit reads this folder)
  middleware/
  types/
  lib/
```

## Scraper (Python)

`scraper/` pulls job listings from Greenhouse job boards into MongoDB:

- `companies` — one document per board, with `sponsorsVisa: true` when the company is on the
  [UK Register of Licensed Sponsors](https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers)
- `jobs` — one document per listing, linked by `companyId` (the company's `_id`), with `isUk` and a
  copy of `sponsorsVisa` for filtering

```sh
npm run db:up          # Postgres + MongoDB
npm run scrape:setup   # once: creates scraper/.venv and installs requirements
npm run scrape:once    # one run (~3 minutes)
npm run scrape         # runs now, then every SCRAPE_INTERVAL_HOURS (default 24)
```

Each run also writes `scraper/data/companies.json` and `scraper/data/jobs.json` (gitignored).

**Adding companies:** add `{ "token": "<board token>" }` to `scraper/seeds.json`; the token is the
last part of `https://job-boards.greenhouse.io/<token>`. New boards are also discovered from Common
Crawl when its index is reachable (often it isn't; runs carry on without it).

**Sponsor matching:** names are compared after dropping case, punctuation and suffixes like
"Ltd"/"Limited"/"UK". When the register uses a different legal name (e.g. Deliveroo is
"Roofoods Ltd"), add it as `"sponsorAliases": ["Roofoods Ltd t/a Deliveroo"]`. Each run logs how
many companies weren't found on the register.
