# Komodo Stack Setup — mws-mtss-system

## Stack Configuration

| Field | Value |
|---|---|
| Stack Name | `mws-mtss-system` |
| Source | **Manual** (not linked_repo) |
| Registry | GHCR (`ghcr.io/mws-mad-labs`) |
| Webhook Secret | Set via Komodo → Stack → Webhook |

---

## Docker Compose (paste into Komodo → Stack → Compose)

```yaml
services:
  backend:
    image: ghcr.io/mws-mad-labs/mws-mtss-system-be:staging
    container_name: mws-mtss-system-be
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3004
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      SESSION_SECRET: ${SESSION_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URL: ${GOOGLE_REDIRECT_URL}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      GOOGLE_AI_MODEL: gemini-flash-latest
      AI_ANALYSIS_ENABLED: "true"
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      OPENROUTER_BASE_URL: https://openrouter.ai/api/v1
      OPENROUTER_MODEL: ${OPENROUTER_MODEL}
      OPENROUTER_FALLBACK_MODELS: ${OPENROUTER_FALLBACK_MODELS}
      OPENROUTER_APP_NAME: IntegraLearn AI Chat
      OPENROUTER_MAX_TOKENS: "1024"
      OPENROUTER_TEMPERATURE: "0.4"
      OPENROUTER_TIMEOUT_MS: "30000"
      AGENT_ROUTER_TOKEN: ${AGENT_ROUTER_TOKEN}
      AGENT_ROUTER_BASE_URL: https://agentrouter.org/v1
      AGENT_ROUTER_MODEL: glm-4.6
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      CORS_ORIGINS: ${CORS_ORIGINS}
      SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN}
      SLACK_APP_TOKEN: ${SLACK_APP_TOKEN}
      SLACK_SIGNING_SECRET: ${SLACK_SIGNING_SECRET}
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: "587"
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      RATE_LIMIT_WINDOW: "15"
      RATE_LIMIT_MAX_REQUESTS: "600"
    networks:
      - mtss-system-net
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3004/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  frontend:
    image: ghcr.io/mws-mad-labs/mws-mtss-system-fe:staging
    container_name: mws-mtss-system-fe
    restart: unless-stopped
    ports:
      - "8082:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - mtss-system-net

networks:
  mtss-system-net:
    name: mws-mtss-system-net
    driver: bridge
```

---

## GitHub Secrets to set in the repo

In GitHub → `MWS-MAD-Labs/mws-mtss-system` → Settings → Secrets → Actions:

| Secret Name | Value |
|---|---|
| `KOMODO_WEBHOOK_SECRET` | Same as the webhook secret on the Komodo stack |
| `KOMODO_WEBHOOK_URL` | The Komodo webhook URL for the `mws-mtss-system` stack |

---

## Environment Variables di Komodo

Di Komodo → Stack `mws-mtss-system` → Environment:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://mtss-stg.mws.web.id/auth/google/callback
GOOGLE_AI_API_KEY=...
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=qwen/qwen3-8b:free
OPENROUTER_FALLBACK_MODELS=meta-llama/llama-4-scout:free,deepseek/deepseek-r1-0528:free
AGENT_ROUTER_TOKEN=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://mtss-stg.mws.web.id
CORS_ORIGINS=https://mtss-stg.mws.web.id
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SMTP_USER=no-reply@millennia21.id
SMTP_PASS=...
SMTP_FROM=no-reply@millennia21.id
```

---

## Deploy Flow

```
Push to main
  → GH Actions: test-be + test-fe (parallel)
  → GH Actions: build-be + build-fe (parallel, after tests)
  → GH Actions: deploy (trigger Komodo webhook)
  → Komodo: docker compose pull → docker compose up -d
  → Service accessible at: http://103.164.111.186:8082
```

## Domain Setup (Cloudflare)

Add DNS record:
- Type: A
- Name: `mtss-stg`
- Value: `103.164.111.186`
- Proxy: ON (orange cloud)
- SSL: Full (strict)

Akses: `https://mtss-stg.mws.web.id`
