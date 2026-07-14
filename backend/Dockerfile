FROM node:18-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:18-alpine AS runner

WORKDIR /app

ARG BUILD_ID=dev
ENV BUILD_ID=$BUILD_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs uploads

ENV NODE_ENV=production
EXPOSE 3004

CMD ["node", "src/server.js"]
