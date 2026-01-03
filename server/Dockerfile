# ------------------------------------------------
# 🧠 TrichMind Backend API (Node.js + Express + TS)
# ------------------------------------------------

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TS -> dist
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what we need
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# If you have runtime assets (views/public), copy them too:
# COPY --from=builder /app/public ./public

EXPOSE 8080

# Prefer a real start script: "start": "node dist/server.js"
CMD ["node", "dist/server.js"]
