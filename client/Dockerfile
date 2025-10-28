# -------------------------------------------------------
# 1️⃣ Base image — lightweight Node 20 Alpine
# -------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (use npm ci for reproducibility)
RUN npm ci

# Copy project source
COPY . .

# Build production files (output goes to /app/dist)
RUN npm run build

# -------------------------------------------------------
# 2️⃣ Production stage — use a simple static server
# -------------------------------------------------------
FROM node:20-alpine AS serve

WORKDIR /app

# Install a minimal static file server
RUN npm install -g serve

# Copy built frontend from previous stage
COPY --from=build /app/dist ./dist

EXPOSE 5173

# Serve the built app
CMD ["npm", "run", "dev:stack"]
