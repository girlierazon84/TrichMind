# server/Dockerfile
# ------------------------------------------------
# 🧠 TrichMind Backend API (Node.js + Express)
# ------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Install build tools for any native deps
RUN apk add --no-cache python3 make g++

# Copy package manifests first for caching
COPY package*.json ./

# Deterministic dependency install
RUN npm ci

# Copy the full backend source
COPY . .

# Expose backend port
EXPOSE 8080

# Default command (dev mode; for prod you might use `npm run start`)
CMD ["npm", "run", "dev"]
