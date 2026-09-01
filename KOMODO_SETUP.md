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

Compose reference is also available in the gateway repo:
`mws-gateway/deploy/mtss-system.compose.yml`.

Required GitHub Actions secrets:

| Secret name | Notes |
|---|---|
| `KOMODO_STAGING_WEBHOOK_URL` | Preferred staging webhook URL |
| `KOMODO_STAGING_WEBHOOK_SECRET` | Preferred staging webhook secret |
| `KOMODO_WEBHOOK_URL` | Legacy fallback, currently supported |
| `KOMODO_WEBHOOK_SECRET` | Legacy fallback, currently supported |

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
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://app-stg.mws.web.id/mtss/auth/google/callback
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
```

### Production

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://app.millenniaws.sch.id/mtss/auth/google/callback
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
```

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
