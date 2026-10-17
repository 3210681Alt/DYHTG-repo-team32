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
