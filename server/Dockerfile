# ---------------------------
# 🧠 TrichMind Backend (Node + TypeScript)
# ---------------------------

# 1️⃣ Base Image
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# 2️⃣ Install dependencies separately for caching
COPY package*.json ./
RUN npm ci --omit=dev

# 3️⃣ Copy source code
COPY . .

# 4️⃣ Build TypeScript → JavaScript
RUN npm run build

# 5️⃣ Expose port
EXPOSE 8080

# 6️⃣ Default startup command
CMD ["node", "dist/server.js"]
