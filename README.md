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

## Deployment

Same Komodo-based architecture as the legacy stack. The repo ships with `Dockerfile` + `docker-compose.yml` — adjust `REPO`, image tags, and domain routing to match the new GitHub Organization before the first deploy.
