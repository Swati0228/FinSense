# syntax=docker/dockerfile:1
# ─── Stage 1: Install dependencies ───────────────────────────────────────────
# Uses BuildKit cache mounts so npm ci is fast on re-runs
# (node_modules layer is only rebuilt if package-lock.json changes)
FROM node:20-alpine AS deps

WORKDIR /app

# Install native build tools once. Cached by Docker layer unless Alpine version changes.
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./

# --mount=type=cache keeps npm's download cache on the build machine.
# Second build: npm ci completes in seconds because packages are already cached.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# ─── Stage 2: Build the Next.js app ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy deps first — this layer is cached until package-lock.json changes
COPY --from=deps /app/node_modules ./node_modules

# Copy source files — layer is invalidated only when source changes
COPY . .

# Cache Next.js build cache between runs for even faster rebuilds
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ─── Stage 3: Minimal production image ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone output: server.js + dependencies are self-contained
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets must be copied manually into the standalone folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

USER nextjs

EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Use node server.js — required for standalone output (next start does NOT work)
CMD ["node", "server.js"]
