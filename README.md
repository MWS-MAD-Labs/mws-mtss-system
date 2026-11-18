# MWS MTSS System

Multi-Tiered System of Support (MTSS) product for MWS — one of two applications split from the legacy MWS-APP monorepo. Sibling app: `mws-daily-checkin`.

## Structure

```
mws-mtss-system/
├── backend/     Express + MongoDB API (port 3004)
└── frontend/    React + Vite SPA (dev port 5174)
```

## Scope (what lives here)

- MTSS tiers, strategies, mentor assignments, tier-review requests
- MTSS student portal + profile
- Teacher / admin / observer dashboards
- Pilot-testing hub + pilot feedback sessions
- AI Assistant chat and AI insights (Grade 7 Helix + Kindergarten modes)
- Shared auth (Google OAuth + JWT), user management, notifications

Daily Emotional Check-In lives in the `mws-daily-checkin` repository.

## Local development

### Backend

```bash
cd backend
cp .env.example .env       # fill in secrets
npm install
npm run dev                # nodemon → http://localhost:3004
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # vite → http://localhost:5174
```

The Vite dev server proxies `/api`, `/auth`, and `/socket.io` to the backend on port 3004.

## Kindergarten mode

MTSS for Kindergarten is **qualitative** — no scores. Use `mode: 'qualitative'` on MentorAssignment and the Learning-Story-with-Signal check-in format (CORN + emerging/developing/consistent signal). Do not apply qualitative behavior to other grade levels.

## Integration with Daily Check-In

Both products share the same Google OAuth users. A user signing in here without MTSS access is redirected to `mws-daily-checkin` (configured at deployment time).

## Students and their email in Central

A student record (`MTSSStudent`) is tied to the Central person id (`centralPersonId`), and the email is only a label. The roster sync (`jobs/mtssStudentRosterSync.js`) finds a record by the person id first. A record from before the id existed is found by its email and gets the id on the first run, so after the first sync every enrolled student is tied. When Central gives a student a new email, the same record takes it, with its tiers, interventions and mentor assignments.

Things the sync leaves for a person to look at, and reports: a new email that another record already has, an email Central gave to a different person, and a new record that shares a name with an unmatched older one (the older one is flagged `orphanedAt` and probably holds the history; join them by hand, the way `src/scripts/mergeDuplicateStudentEmails.js` did). The manual scripts `applyCentralStudentSync.js` and `dryRunCentralStudentSync.js` still match by email only, so do not run them after emails changed in Central; the scheduled sync does the same work by person id.

## Deployment

Komodo deployment is image-based and driven by GitHub Actions:

- `staging` branch -> GHCR `:staging` images -> staging stack at `https://app-stg.mws.web.id/mtss/`
- `main` branch -> GHCR `:production` images -> production stack at `https://app.millenniaws.sch.id/mtss/`

See `KOMODO_SETUP.md` for the full stack, secret, and URL reference.
