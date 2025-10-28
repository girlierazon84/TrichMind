# -------------------------------------------------------
# 1️⃣ Base Stage — Common setup
# -------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency files for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full project
COPY . .

# -------------------------------------------------------
# 2️⃣ Build Stage — for production builds
# -------------------------------------------------------
FROM base AS build
RUN npm run build

# -------------------------------------------------------
# 3️⃣ Dev Stage — for local hot reload (Vite)
# -------------------------------------------------------
FROM base AS dev

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -------------------------------------------------------
# 4️⃣ Prod Stage — serve static files
# -------------------------------------------------------
FROM node:20-alpine AS prod

WORKDIR /app

# Install a lightweight static server
RUN npm install -g serve

# Copy build output from the build stage
COPY --from=build /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]

# -------------------------------------------------------
# 5️⃣ Dynamic Entrypoint — choose mode automatically
# -------------------------------------------------------
# Use NODE_ENV to decide which stage to run at runtime
# docker build --target dev   -t trichmind-client-dev .
# docker build --target prod  -t trichmind-client-prod .
