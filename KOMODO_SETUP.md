# Komodo Stack Setup - mws-mtss-system

MTSS is served under `/mtss/` inside the unified MWS app.

| Environment | Branch | Image tag | Public URL | Komodo stack |
|---|---|---|---|---|
| Staging | `staging` | `staging` | `https://app-stg.mws.web.id/mtss/` | `mws-mtss-system` |
| Production | `main` | `production` | `https://app.millenniaws.sch.id/mtss/` | `mws-mtss-system-production` |

The stack is manual compose in Komodo. Komodo does not build images; GitHub
Actions builds BE/FE images, pushes them to GHCR, then calls the stack webhook.

## Staging Stack

Use the existing staging stack if it already exists:

| Field | Value |
|---|---|
| Stack name | `mws-mtss-system` |
| Source | Manual compose |
| Branch that triggers it | `staging` |
| Images | `ghcr.io/mws-mad-labs/mws-mtss-system-{be,fe}:staging` |
| Gateway network | `mws-unified` |
| Gateway hostname | `https://app-stg.mws.web.id` |
| Path | `/mtss/` |

The staging stack runs `deploy/staging.compose.yml` (not the `docker-compose.yml` at the repo root, which is only a
local reference). In the Komodo stack: Run Directory `deploy`, File Path `staging.compose.yml`, branch `staging`.

What matters in it: the frontend container is named `mtss-system-fe` and joins the external network `mws-unified`. The
gateway finds MTSS by that name on that network. A stack that only sits on its own network (for example the root
`docker-compose.yml`, which publishes port 8082) is invisible to the gateway, and every address under `/mtss/` answers
`502` from Cloudflare, including `/mtss/auth/sso` from the Hub card, even though both containers show as running.
Check with `https://app-stg.mws.web.id/mtss/api/health`: it must answer 200 and show a `buildId`.

Required GitHub Actions secrets:

| Secret name | Notes |
|---|---|
| `KOMODO_WEBHOOK_URL_STAGING` | The Deploy webhook of the staging stack in Komodo. Not read from `KOMODO_WEBHOOK_URL`, so staging can never trigger another stack |
| `KOMODO_WEBHOOK_SECRET_STAGING` | The staging webhook secret. The shared `KOMODO_WEBHOOK_SECRET` is read when this is empty |
| `KOMODO_STAGING_WEBHOOK_URL` / `KOMODO_STAGING_WEBHOOK_SECRET` | The older names of the two, still read |

## Production Stack

Production/main is deployed from a dedicated Komodo stack:

| Field | Value |
|---|---|
| Stack name | `mws-mtss-system-production` |
| Komodo stack id | `6a3b86751309552867cc4205` |
| Source | Git repo |
| Repo | `MWS-MAD-Labs/mws-mtss-system` |
| Branch | `main` |
| Run directory | `deploy` |
| Compose file | `production.compose.yml` |
| Images | `ghcr.io/mws-mad-labs/mws-mtss-system-{be,fe}:production` |
| Gateway network | `mws-unified-prod` |
| Gateway hostname | `https://app.millenniaws.sch.id` |
| Path | `/mtss/` |
| Webhook URL | `https://komo.mws.web.id/listener/github/stack/mws-mtss-system-production/deploy` |

Deploy the production gateway first so the external Docker network
`mws-unified-prod` exists.

Required GitHub Actions secrets:

| Secret name | Notes |
|---|---|
| `KOMODO_PRODUCTION_WEBHOOK_URL` | Optional override for the production stack webhook URL |
| `KOMODO_PRODUCTION_WEBHOOK_SECRET` | Preferred production stack webhook secret |
| `KOMODO_STAGING_WEBHOOK_SECRET` / `KOMODO_WEBHOOK_SECRET` | Supported fallback when the production stack uses the existing webhook secret |

## Environment Variables

Set these in the Komodo stack Environment field. Keep secrets out of the repo.

### Staging

```env
MONGODB_URI=mongodb+srv://...
GOOGLE_AI_API_KEY=...
GOOGLE_AI_MODEL=gemini-flash-latest
AI_ANALYSIS_ENABLED=true
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=qwen/qwen3-8b:free
OPENROUTER_FALLBACK_MODELS=meta-llama/llama-4-scout:free,deepseek/deepseek-r1-0528:free
OPENROUTER_APP_NAME=IntegraLearn AI Chat Staging
OPENROUTER_HTTP_REFERER=https://app-stg.mws.web.id
OPENROUTER_MAX_TOKENS=1024
OPENROUTER_TEMPERATURE=0.4
OPENROUTER_TIMEOUT_MS=30000
AGENT_ROUTER_TOKEN=...
AGENT_ROUTER_BASE_URL=https://agentrouter.org/v1
AGENT_ROUTER_MODEL=glm-4.6
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://app-stg.mws.web.id
CORS_ORIGINS=https://app-stg.mws.web.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
HUB_BASE_URL=https://app-stg.mws.web.id
CENTRAL_API_BASE_URL=https://db-stg.mws.web.id/api/internal
CENTRAL_API_TOKEN=...
CENTRAL_ORGANIZATION_ID=org_...
```

### Production

```env
MONGODB_URI=mongodb+srv://...
GOOGLE_AI_API_KEY=...
GOOGLE_AI_MODEL=gemini-flash-latest
AI_ANALYSIS_ENABLED=true
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=qwen/qwen3-8b:free
OPENROUTER_FALLBACK_MODELS=meta-llama/llama-4-scout:free,deepseek/deepseek-r1-0528:free
OPENROUTER_APP_NAME=IntegraLearn AI Chat
OPENROUTER_HTTP_REFERER=https://app.millenniaws.sch.id
OPENROUTER_MAX_TOKENS=1024
OPENROUTER_TEMPERATURE=0.4
OPENROUTER_TIMEOUT_MS=30000
AGENT_ROUTER_TOKEN=...
AGENT_ROUTER_BASE_URL=https://agentrouter.org/v1
AGENT_ROUTER_MODEL=glm-4.6
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://app.millenniaws.sch.id
CORS_ORIGINS=https://app.millenniaws.sch.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
HUB_BASE_URL=https://app.mws.web.id
CENTRAL_API_BASE_URL=https://db.mws.web.id/api/internal
CENTRAL_API_TOKEN=...
CENTRAL_ORGANIZATION_ID=org_...
```

The four Central lines come from the block Central shows when MTSS is added there. The token is shown once. `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_*`, `HUB_SSO_PUBLIC_KEY` and `HUB_INTERNAL_SECRET` are not used any more and can be removed from the Environment field.

`HUB_ACCESS_COOKIE_NAME` is optional (default `hub_at`). Staging and production Hubs share the parent domain `mws.web.id`, so give staging its own name (for example `hub_at_stg`) on the staging Hub and on every staging app. Deploy the apps first, then set it everywhere together and sign in again.

MTSS reads the Hub's session cookie on the parent domain, so the app and the Hub must be under the same registrable domain. Staging (`app-stg.mws.web.id`) is. Production is not yet: the Hub is on `app.mws.web.id` and MTSS on `app.millenniaws.sch.id`. Do not merge the shared session to `main` until MTSS is served under the Hub's domain.

## Before the First Deploy

1. In Central, add MTSS with its launch address (staging: `https://app-stg.mws.web.id/mtss`) and copy the block into the Komodo Environment field. The application id must be `mtss`.
2. In the GitHub repository open Settings, then Secrets and variables, then Actions, and add these repository secrets: `STAGING_CENTRAL_API_BASE_URL`, `STAGING_CENTRAL_API_TOKEN` and `STAGING_CENTRAL_ORGANIZATION_ID`, and the same three with `PRODUCTION_` in front. The deploy workflow sends the permission list to Central with them, and stops before deploying if Central says no. Names without the prefix are read too, when the prefixed one is missing.
3. Remove `MWS_DATA_CENTER_API_URL` and `MWS_DATA_CENTER_API_TOKEN` from the Komodo Environment if they are still there. The app reads the `CENTRAL_API_*` names first, but the old ones are used if the new ones are empty.
4. In Central, give the roles of MTSS the permissions they need (the list is in `docs/PEOPLE_AND_PERMISSIONS.md`). Until a role holds `mtss.read`, nobody gets in.
5. Back up the database, then move the old users over once, BEFORE the new version starts for the first time (the script needs `CENTRAL_API_*` in `backend/.env` because it asks Central for each person's id):

```bash
cd backend
npm run migrate:people          # dry-run, prints what it would do
npm run migrate:people:apply    # writes
```

Each person keeps their `_id`, so nothing else has to change, and going back is deploying the old version. If the new version already ran, see `docs/PEOPLE_AND_PERMISSIONS.md` for the emergency tool.

## After a Deploy

The webhook only starts the deploy in Komodo. If the stack fails there (a wrong file path, a bad env), the webhook still answered and the pipeline would be green. The last step of the deploy job asks the health address which build it runs and waits until it is the commit that was just built. If the old version keeps running, the job turns red and says to read the last update of the stack in Komodo.

It needs the public address of the backend health route as `STAGING_HEALTH_URL` (and `PRODUCTION_HEALTH_URL` for main) in the repository secrets or variables, for example `https://app-stg.mws.web.id/mtss/api/health`. Open it in a browser first to check that the gateway passes it on and that it shows `buildId`. Without the address the step only warns.

## Deploy Flow

```text
Push to staging
  -> GitHub Actions: staging quality gates
  -> Build BE/FE images tagged :staging
  -> Trigger Komodo stack mws-mtss-system
  -> Gateway serves https://app-stg.mws.web.id/mtss/

Push to main
  -> GitHub Actions: production quality gates
  -> Build BE/FE images tagged :production
  -> Trigger Komodo stack mws-mtss-system-production
  -> Gateway serves https://app.millenniaws.sch.id/mtss/
```
