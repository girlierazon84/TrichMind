# -------------------------------------------------------
# 1️⃣ Base Stage — Dependencies
# -------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# -------------------------------------------------------
# 2️⃣ Build Stage — Compile the Next.js app
# -------------------------------------------------------
FROM base AS build

# Build Next.js app for production
RUN npm run build

# -------------------------------------------------------
# 3️⃣ Production Stage — Serve the built app
# -------------------------------------------------------
FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

# Install only production dependencies
RUN npm ci --only=production

# Expose default Next.js port
EXPOSE 5000

# Start Next.js in production mode
CMD ["npm", "run", "dev"]

# -------------------------------------------------------
# 🧠 Usage
# -------------------------------------------------------
# Build the image:
#   docker build -t trichmind-client .
#
# Run the container:
#   docker run -p 5000:5000 trichmind-client
#
# For development (hot reload), use:
#   docker run -p 5000:5000 -v .:/app -v /app/node_modules trichmind-client npm run dev
