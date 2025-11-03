# -------------------------------------------------------
# 🧱 1️⃣ Base Stage — Install Dependencies
# -------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# Install dependencies (use npm ci for clean install)
RUN npm ci

# Copy the rest of the project
COPY . .

# -------------------------------------------------------
# ⚙️ 2️⃣ Build Stage — Compile the Next.js App
# -------------------------------------------------------
FROM base AS build

# Set environment for build
ENV NODE_ENV=production

# Build Next.js (generates .next/)
RUN npm run build

# -------------------------------------------------------
# 🚀 3️⃣ Production Stage — Run the Optimized App
# -------------------------------------------------------
FROM node:20-alpine AS prod

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy necessary build output and assets from build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

# Expose app port (Next.js runs internally on 3000)
EXPOSE 5000

# Start Next.js production server on port 5050
ENV PORT=5050
CMD ["npm", "run", "dev"]

# -------------------------------------------------------
# 🧠 Usage
# -------------------------------------------------------
# Build image:
#   docker build -t trichmind-client .
#
# Run container:
#   docker run -p 5000:5000 trichmind-client
#
# For development (hot reload):
#   docker run -it -p 5000:3000 -v .:/app -v /app/node_modules trichmind-client npm run dev
