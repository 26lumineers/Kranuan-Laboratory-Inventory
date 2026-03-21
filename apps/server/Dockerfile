# Backend Dockerfile - Bun + Elysia
FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package.json bun.lockb* ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# Copy workspace package files
COPY package.json ./root-package.json
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate database types if needed
RUN bun run db:generate || true

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/config ./config
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the server
CMD ["bun", "run", "dist/index.js"]
