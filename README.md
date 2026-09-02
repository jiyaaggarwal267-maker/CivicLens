# CivicLens

**AI-powered civic issue management — from a citizen's photo to a verified fix.**

CivicLens turns fragmented, one-off citizen complaints into a single source of truth for
local authorities: reports are automatically classified, duplicate reports of the same
physical problem are consolidated, issues are prioritized by a transparent scoring formula,
routed to the right department, and — once an authority marks something fixed — an
AI-assisted before/after comparison and the original citizen's own confirmation decide
whether it's actually closed.

```
Citizen reports → AI understands → duplicates consolidated → issue prioritized
→ authority assigns & resolves → AI verifies the fix → citizen confirms or reopens
```

That loop — closed by the citizen, not just the government — is the core idea: most civic
complaint tools stop at "report submitted." CivicLens stays open until the person who
reported the problem agrees it's gone.

---

## Table of contents

- [The problem](#the-problem)
- [How it works](#how-it-works)
- [Features](#features)
- [The citizen experience](#the-citizen-experience)
- [The authority operations console](#the-authority-operations-console)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Demo credentials](#demo-credentials)
- [Demo Mode (for presenters)](#demo-mode-for-presenters)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Design system](#design-system)

---

## The problem

Civic complaint systems today are mostly one-way: a citizen files a report and it disappears
into a queue. The same pothole gets reported five times by five different people as five
separate, uncounted tickets. Authorities have no reliable signal for what's actually urgent
versus what's just loud. And when something is marked "resolved," nobody checks whether it
really was — the citizen who reported it is never asked again.

CivicLens is built around fixing all four of those gaps at once, in a single connected
lifecycle rather than four separate features bolted together.

## How it works

### 1. AI understands the report

When a citizen submits a photo and description, `geminiService` classifies the issue
(category + severity) using Gemini's vision model, with a **deterministic offline mock**
that activates automatically if no API key is configured — so the product never breaks in a
live demo for lack of network access or quota. A lightweight `embeddingService` also turns
the description into a vector (real Gemini embeddings when available, a hash-based
bag-of-words fallback otherwise) for semantic similarity comparisons.

### 2. Duplicate reports are consolidated

A new report is checked against existing open issues using **PostGIS** (`ST_DWithin`) for
geographic proximity, category match, and text-embedding similarity (`duplicateService` +
`geoService`). If it's within ~250m of an existing issue of the same category, it's folded
into that issue instead of creating a new one — the citizen sees "Duplicate detected, 3
reports → 1 civic issue," and the issue's report count, severity, and priority all update
live.

### 3. Priority is computed, not guessed

`priorityService` runs a deterministic weighted formula — nothing here is hardcoded on the
frontend; the UI only ever displays what this function returns:

| Factor | Weight | Scoring |
|---|---|---|
| Severity | 40% | Low → 25, Medium → 60, High → 95 |
| Report count | 25% | 35 + (reports − 1) × 25, capped at 100 |
| Traffic exposure | 20% | Low → 25, Medium → 55, High → 90 |
| Age (days open) | 15% | days × 7, capped at 100 |

The weighted sum is rounded to a 0–100 score, bucketed into **Low** (<40), **Medium**
(40–69), or **High** (≥70) priority — the same bands used everywhere in the UI (badges,
sorting, the dashboard donut chart).

### 4. The right department, automatically

Category maps to a recommended department (`recommendDepartment`) — e.g. potholes and
footpaths → Road Maintenance, streetlights → Electrical, garbage → Sanitation, water/drain
issues → Water Works — shown to the authority before they assign, and used as the default in
the assign dialog.

### 5. Resolution is verified, not just claimed

When an authority uploads a photo of the completed repair, `verifyResolution` sends the
original citizen photo and the new photo to Gemini's vision model side by side, asking it to
judge whether the same issue looks fixed. It returns a status (**Likely Resolved / Unclear /
Not Resolved**) with a confidence score — explicitly labeled "AI-assisted," never presented
as a guaranteed outcome.

### 6. The citizen has the final word

After an authority marks an issue Resolved, the original issue page shows **"Was the issue
actually resolved?"** with Yes/No buttons. **Yes** closes the loop. **No** flips the status to
**Reopened** and puts it straight back on the authority's active queue — closing the loop the
other systems leave open.

## Features

**Citizen-facing**
- Photo + location civic issue reporting with a live map picker (drag pin, click to place, or
  a one-click Dwarka Sector 10 preset for demos)
- Real-time AI analysis feedback during submission (classification, severity, duplicate
  check) — fast, not a fake multi-second loading screen
- Automatic duplicate detection and consolidation, shown transparently to the reporter
- A public issue explorer with status filters, sorted by priority
- A full issue detail page: photos, live map, priority breakdown, every citizen report
  attached to the issue, and a complete timeline
- A personalized **"My Reports" dashboard** for logged-in citizens
- The resolution confirm/reopen decision, front and center

**Authority-facing**
- An operations console with live counts (open, high priority, in progress, resolved)
- A priority-sorted issue queue with severity, report count, and recommended department at a
  glance
- One-click department assignment and status transitions (Open → Assigned → In Progress →
  Resolved)
- A guided resolution flow: upload an after-photo → AI verification runs automatically →
  confidence-scored result → explicit confirm step
- A live analytics view: status-breakdown donut chart, issues-by-category breakdown,
  resolution rate
- Reopened issues automatically reappear in the active queue

**Platform**
- Interactive Leaflet/OpenStreetMap map of every tracked issue, color-coded by priority, with
  custom elevated pin markers
- Before/after drag-to-compare image slider everywhere a resolution is shown
- Simulated but structurally real login for both roles, route-guarded, session-persisted
- A **Demo Mode** reset button that reseeds a deterministic dataset for reliable live
  walkthroughs
- Fully responsive (desktop, tablet, mobile) with no horizontal scroll on any page
- Deploys as a single service — no split frontend/backend hosting or CORS configuration
  required

## The citizen experience

| Page | What it's for |
|---|---|
| `/` | Landing page — the pitch, live stats, and a map preview |
| `/report` | Submit a new issue: photo, location, description → instant AI analysis result |
| `/issues` | Browse every tracked issue, filterable by status, sorted by priority |
| `/issues/:id` | Full detail: photos, map, priority breakdown, all consolidated reports, timeline, and (once resolved) the confirm/reopen prompt |
| `/map` | City-wide map of every issue |
| `/dashboard` *(requires citizen login)* | "My Reports" — every report this citizen has personally filed, with live status and priority |

## The authority operations console

Everything under `/authority/*` requires signing in as Authority (see
[demo credentials](#demo-credentials)) and lives inside a dedicated sidebar layout, separate
from the public citizen pages.

| Page | What it's for |
|---|---|
| `/authority` | Dashboard: overview counts, the priority-sorted issue table, a status-breakdown donut chart, category breakdown, resolution rate |
| `/authority/issues` | Full sortable/filterable issue list |
| `/authority/issues/:id` | Case management: assign a department, change status, and run the guided resolution + AI-verification flow |

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui-style components, Lucide icons, React Router, Leaflet + OpenStreetMap |
| Backend | Node.js, Express, TypeScript, REST API |
| Database | PostgreSQL + PostGIS (geospatial proximity queries), Prisma ORM |
| AI | Google Gemini — vision classification, severity assessment, resolution verification, and text embeddings — with a deterministic mock fallback whenever no API key is configured |
| Storage | Local-disk object storage abstraction (swappable for S3-compatible storage) |

## Project structure

```
CivicLens/
├── backend/
│   ├── prisma/            schema, migrations (incl. the PostGIS geography trigger), seed data
│   └── src/
│       ├── controllers/    request handlers
│       ├── routes/         REST route definitions
│       ├── services/       geminiService, embeddingService, duplicateService, geoService,
│       │                   priorityService, storageService, reportIngestService, seedService
│       ├── middleware/     upload (multer), error handling
│       └── db/              Prisma client
└── frontend/
    └── src/
        ├── pages/           route-level views (citizen, authority/, citizen/)
        ├── components/
        │   ├── ui/          shadcn-style primitives (button, card, dialog, table, tabs, ...)
        │   ├── issue/       StatusBadge, PriorityBadge, Timeline, BeforeAfterSlider, ...
        │   ├── map/         IssueMap (Leaflet)
        │   ├── report/      UploadDropzone, LocationPicker
        │   ├── authority/   AssignDialog, ResolutionDialog
        │   ├── charts/      DonutChart
        │   └── layout/      Navbar, AuthorityLayout, RequireAuth guards
        ├── context/         RoleContext (citizen/authority session state)
        └── lib/              typed API client, formatting helpers
```

## Getting started

### Prerequisites

- Node.js 20.11+
- A PostgreSQL database with the `postgis` extension available (locally via
  `brew install postgresql@17 postgis`, or a hosted provider — Neon, Supabase, Render, and
  Railway all support it)

### 1. Database

```bash
createdb civiclens
psql -d civiclens -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

(Skip this step if using a hosted provider — just create the database there.)

### 2. Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL, and GEMINI_API_KEY if you have one
npm install
npx prisma generate
npx prisma migrate deploy   # applies the schema + PostGIS geography column/trigger
npm run seed                # loads the CIV-042 demo scenario
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api and /uploads to :4000)
```

### Environment variables

See `backend/.env.example`:

```
DATABASE_URL=               # PostgreSQL connection string (PostGIS-enabled database)
PORT=4000
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=              # optional — falls back to a deterministic mock AI service
OBJECT_STORAGE_URL=          # optional — falls back to local disk (backend/uploads)
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
```

If you set `GEMINI_API_KEY`, use a current Gemini model name (Google periodically retires
older ones) — `geminiService.ts` and `embeddingService.ts` are the two places model names are
configured. The mock fallback needs no configuration at all and is what the product runs on
by default.

The frontend has no required environment variables — it talks to `/api` via the Vite dev
proxy locally, or same-origin once deployed.

## Demo credentials

CivicLens has two separate, login-gated experiences reachable from `/login`. Sign-in is
simulated for demo purposes (no password is actually checked) — both sets of fields are
pre-filled so a presenter can sign in with one click.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Citizen | `aarav@civiclens.demo` | `citizen123` | `/dashboard` — "My Reports," personalized to that citizen |
| Authority | `authority@civiclens.demo` | `admin123` | `/authority` — the Operations Console |

`/authority/*` and `/dashboard` redirect to the matching login tab if visited signed out. The
public citizen pages (`/`, `/report`, `/issues`, `/map`) never require a login.

## Demo Mode (for presenters)

Every page carries a small **Demo Mode** control (top right of the nav / authority header).
**Load Demo Scenario** wipes and reseeds the database with the same deterministic dataset —
**CIV-042** (a consolidated 3-report pothole in Dwarka Sector 10, priority 85/100) plus six
supporting issues in different lifecycle stages — so a live walkthrough is always
reproducible in front of an audience. The same reset is available directly at
`POST /api/demo/reset`.

**Suggested live walkthrough:**

1. As **Citizen**, go to **Report Issue** → upload a pothole photo → select **Dwarka Sector
   10** → submit. CivicLens responds with **Pothole detected, Severity: High**.
2. Submit a second report near the same spot → **Duplicate detected**.
3. Submit a third → **3 reports → 1 civic issue**, consolidated into **CIV-042**.
4. Open the issue: **Priority 85/100 · HIGH**, computed live from severity, report count,
   traffic exposure, and age.
5. Click **Authority Dashboard** → sign in with the pre-filled credentials → CIV-042 sits at
   the top of the priority queue, with **Road Maintenance Department** recommended.
6. **Assign** → **Mark In Progress**.
7. **Mark Resolved** → upload a repaired-road photo → AI verification runs → **Likely
   Resolved ✓** with a confidence score and a draggable before/after comparison.
8. **Confirm Resolution.**
9. Back as **Citizen**, open the issue → **Was the issue actually resolved?** → **Yes** marks
   it **Resolved**; **No** marks it **Reopened**, and it reappears in the authority queue.

## Deployment

CivicLens deploys as a **single service** — the Express backend also serves the built
frontend from its own origin once `frontend/dist` exists, so there's no second service, no
CORS configuration, and no API base-URL to wire up. Local dev is unaffected and still runs
the two-server Vite-proxy setup described above.

This needs a host that runs a **persistent Node process with a writable disk** (Render,
Railway, Fly.io, a VPS) rather than a serverless platform — uploaded photos are written to
`backend/uploads/` on disk, and a serverless filesystem won't persist them between requests.
It also needs a Postgres provider that allows the `postgis` extension (Render, Railway, Neon,
and Supabase all do).

From the repo root:

```bash
npm run build       # builds frontend, then backend (runs prisma generate + tsc)
npm run db:migrate  # prisma migrate deploy — applies schema + PostGIS trigger
npm run db:seed     # optional — loads the demo scenario
npm run start       # starts the single service (serves API + frontend on $PORT)
```

Set `DATABASE_URL` and (optionally) `GEMINI_API_KEY` as environment variables on the host.
`PORT` is usually supplied automatically. `CORS_ORIGIN` isn't needed for the single-service
setup — same-origin requests don't use CORS — but is available if you ever split the frontend
and backend into separately deployed services.

## API reference

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/reports` | Submit a citizen report (runs AI classification + duplicate detection) |
| GET | `/api/reports?reporterName=` | A citizen's own submitted reports (backs "My Reports") |
| GET | `/api/issues` | List civic issues |
| GET | `/api/issues/:id` | Issue detail (reports, resolutions, feedback, timeline) |
| POST | `/api/issues/:id/reports` | Attach a report to a specific issue |
| POST | `/api/issues/:id/assign` | Assign a department |
| PATCH | `/api/issues/:id/status` | Change status |
| POST | `/api/issues/:id/resolution` | Upload resolution evidence |
| POST | `/api/issues/:id/verify` | Run AI-assisted resolution verification |
| POST | `/api/issues/:id/feedback` | Citizen confirms or reopens |
| GET | `/api/issues/stats` | Dashboard summary stats |
| GET | `/api/map/issues` | Map data |
| POST | `/api/demo/reset` | Reload the deterministic demo scenario |

## Design system

White backgrounds, generous whitespace, and a blue accent palette (`#2563EB` primary,
`#1D4ED8` deep, `#0EA5E9` sky) — built to read as a serious civic-operations product rather
than a generic AI-chatbot template. Status and priority use a consistent color language
throughout (blue = open, amber = in progress, green = resolved, red = high
priority/reopened), restrained glassmorphism on floating map controls and overlays, and
Lucide icons throughout rather than emoji.
