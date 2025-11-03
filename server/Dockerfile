# ------------------------------------------------
# 🧠 TrichMind Backend API (Node.js + Express)
# ------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the full backend source
COPY . .

# Expose backend port
EXPOSE 8080

# Run server in development mode
CMD ["npm", "run", "dev"]
