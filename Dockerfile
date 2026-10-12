# Stage 1: Build Frontend Assets & TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full application source code
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests
COPY package*.json ./

# Install only production runtime dependencies
RUN npm ci --only=production

# Copy built distribution assets and server sources
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/users_config.json ./users_config.json 2>/dev/null || true
COPY --from=builder /app/system_settings_config.json ./system_settings_config.json 2>/dev/null || true

# Install tsx globally or locally to run TypeScript server in production
RUN npm install -g tsx

# Expose Web Platform Port
EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start SEMOR CYBER Web Platform
CMD ["tsx", "server.ts"]
