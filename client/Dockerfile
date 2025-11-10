# -------------------------------------------------------
# 🏗️ Stage 1: Build the Vite app
# -------------------------------------------------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package*.json ./

# Install dependencies (omit dev deps if using a lockfile later)
RUN npm ci

# Copy rest of the app
COPY . .

# Build the production bundle
RUN npm run build

# -------------------------------------------------------
# 🚀 Stage 2: Serve static files with NGINX
# -------------------------------------------------------
FROM nginx:alpine AS prod

# Copy built Vite dist → nginx html dir
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default nginx.conf
RUN rm /etc/nginx/conf.d/default.conf

# Add custom config (see below)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5000
EXPOSE 5000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
