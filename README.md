# CafeVibe

AI-assisted café discovery: describe what you need in natural language, review and edit the
extracted intent, then get ranked cafés with explanations based on data the app actually has.

> **Status: Phase 3 (Search domain backend).** The backend has a health endpoint and a `/api/v1/search`
> endpoint that accepts intent (query, filters) and returns ranked cafés. The frontend has the design
> tokens, base UI components, a responsive shell and a landing page. The search box collects a query
> but intent parsing, result display and the map are planned for later phases.

## Frontend design system (Phase 2)

- **Tokens** live in one place: `frontend/src/index.css` (`@theme`), derived from `design-system-v1.md`.
  Changing the look (e.g. after a Figma redesign) means editing tokens there, not individual components.
- **Components**: `frontend/src/components/ui/` (Button, Input, Chip, Card, Skeleton, EmptyState,
  ErrorState, SearchBox, Logo) and `frontend/src/components/layout/` (Navbar, Footer, AppLayout).
  They are written in the shadcn/ui style (Radix Slot + class-variance-authority + tailwind-merge);
  the shadcn CLI was not used because its registry was unreachable from the build environment.
- **Routes**: `/` landing, `/search` placeholder, `/status` API health, anything else a 404 page.

### Deliberate deviations from `design-system-v1.md`

All were measured; `frontend/src/test/tokens.test.ts` fails if a color pair drops below its WCAG AA threshold.

| Deviation | Why |
| --- | --- |
| Primary button uses dark text (`text`) on `brand-500` | White on `brand-500` is 3.09:1, below the 4.5:1 AA minimum. |
| New token `brand-550` (#E06648) for primary hover | Dark text on `brand-600` is about 4.1:1; on `brand-550` it is 4.55:1. |
| New token `border-strong` (#8A847C) for form controls | `border` (#E5DED5) is 1.25:1 on `bg`; control boundaries need 3:1. |
| Selected chip uses `text` on `brand-100` + check icon + stronger border | `brand-700` on `brand-100` is 4.21:1. |
| Headings use Inter instead of DM Sans | DM Sans lacks 90 of 134 Vietnamese letters. Switch via `--font-heading`. |

Automated accessibility checks (axe) cover only part of WCAG; a manual screen reader pass has not been done.

## Structure

```text
CafeVibe/
├── frontend/   React + Vite + TypeScript + Tailwind CSS (independent app)
├── backend/    Node.js + Express + TypeScript (independent app)
├── docs/       Project documentation
└── .github/    GitHub Actions CI
```

The frontend and backend are separate npm projects. There is no root `package.json` or workspace:
install and run each one from its own folder.

## Requirements

- Node.js 20 or newer (developed on Node 22)
- npm

## Run locally

### 1. Backend (http://localhost:4000)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Check it: `curl http://localhost:4000/api/v1/health`

### 2. Frontend (http://localhost:5173)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The home page shows the API connection status (loading, success or error with a retry button).

## Environment variables

Real `.env` files are git-ignored. Only `.env.example` files with placeholders are committed.

| App      | Variable            | Required | Default                 | Purpose                                  |
| -------- | ------------------- | -------- | ----------------------- | ---------------------------------------- |
| backend  | `FRONTEND_ORIGIN`   | yes      | —                       | Allowed CORS origin (the frontend URL)   |
| backend  | `PORT`              | no       | `4000`                  | API port                                 |
| backend  | `NODE_ENV`          | no       | `development`           | `development`, `test` or `production`    |
| backend  | `PLACE_PROVIDER`    | no       | `mock`                  | Place provider: `mock` (fixture data)    |
| frontend | `VITE_API_BASE_URL` | no       | `http://localhost:4000` | Backend base URL (bundled into the build) |

The backend validates its environment on startup with Zod and exits with a readable message if a
value is missing or invalid. Never put secrets in `VITE_*` variables. No external API keys are
needed at this stage.

## Scripts (run inside `backend/` or `frontend/`)

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the dev server                  |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | TypeScript, no emit                   |
| `npm test`          | Vitest (backend also uses Supertest)  |
| `npm run build`     | Production build                      |
| `npm run format`    | Prettier (write)                      |

## API (Phase 3)

All responses use a consistent envelope: success is `{ "data": T }`, errors are `{ "error": { "code": "...", "message": "..." } }`.

- `GET /api/v1/health` → `200 { "data": { "status": "ok", "timestamp": "<ISO date>" } }`
- `POST /api/v1/search` → Search cafés by intent (see [docs/api-contract.md](docs/api-contract.md) for request/response schema)
  - `200` success with ranked results
  - `400 INVALID_REQUEST` if the body does not match the schema
  - `400 INVALID_JSON` if the body is malformed JSON
  - `413 PAYLOAD_TOO_LARGE` if the body exceeds 100 KB
  - `429 RATE_LIMITED` if the provider rate-limits
  - `502 SERVICE_UNAVAILABLE` if the provider returns a 502
  - `504 SERVICE_UNAVAILABLE` if the provider times out
  - `500 INTERNAL_ERROR` for unexpected errors (stack traces never leak)
- Unknown routes → `404 NOT_FOUND`

## CI

`.github/workflows/ci.yml` runs lint, typecheck, test and build for the backend and the frontend
as two independent jobs on every pull request and on pushes to `main`.

## Known limitations

- Prisma/PostgreSQL (Neon) is intentionally not set up yet; it is planned for the user-data phase.
- Map (Leaflet + OpenStreetMap), design system components and shadcn/ui are planned for later phases.
- The CI workflow has not been executed on GitHub yet; it was only validated against the same
  commands run locally.
