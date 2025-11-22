# client/Dockerfile
# -------------------------------------------------------
# 🏗️ Stage 1: Build the Vite app
# -------------------------------------------------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package*.json ./

# Install dependencies using lockfile
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

# Add custom config (must listen on 5173 to match docker-compose)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Internal port (nginx should listen 5173 in nginx.conf)
EXPOSE 5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
