# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Accept build args
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
# Base path tempat MTSS dilayani oleh gateway (default /mtss/)
ARG VITE_BASE_PATH=/mtss/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.27-alpine AS runner

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets ke subdir /mtss agar path /mtss/* cocok natural
COPY --from=build /app/dist /usr/share/nginx/html/mtss

# Health check (pakai /healthz; root '/' redirect ke /mtss/)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/healthz || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
