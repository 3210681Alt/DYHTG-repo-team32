# DuckFind frontend

React + Vite, styled with Tailwind CSS and [shadcn/ui](https://ui.shadcn.com) components.

## Run it

The backend has to be running first (see `../duckfind-backend/README.md`).

```sh
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

Requests to `/api/...` are forwarded to the backend on port 3000 (see `vite.config.js`), so the
login cookie works without any CORS setup. Use Chrome or Firefox locally: the login cookie is
marked `Secure`, and Safari may not keep it on `http://localhost`.

## Where things are

```
src/
  App.jsx               navbar, footer and the list of pages (routes)
  main.jsx              starts the app
  index.css             colours, fonts and the brutalist theme
  pages/                one file per page (Home, Jobs, JobDetail, Matches, Login, Register, Profile)
  components/           pieces shared by pages (JobCard, JobFilters, VisaStamp, FormField…)
  components/ui/        shadcn/ui components (button, input, select…), restyled for DuckFind
  context/              who is logged in (useAuth)
  lib/api.js            talking to the backend
  lib/internship.js     the Internship class and how a job becomes one
```

## Adding a shadcn component

```sh
npx shadcn@latest add tooltip
```

It lands in `src/components/ui/`. Give it the DuckFind look: `border-2 border-ink`, hard shadows
like `shadow-brutal`, and the colours in `index.css`.
