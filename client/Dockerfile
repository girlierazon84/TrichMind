# -----------------------------------------------------------------
# 🏗️ Next.js Production Build (Standalone) - client/Dockerfile
# -----------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build


# -------------------------------------------------------
# 🚀 Runtime (small image)
# -------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build output (requires output: "standalone")
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# Standalone output includes server.js at root
CMD ["node", "server.js"]