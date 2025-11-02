# server/Dockerfile - Dockerfile for TrichMind Backend

# ---------------------------
# 🧠 TrichMind Backend (Dev)
# ---------------------------
FROM node:20-alpine
WORKDIR /app

# Install build tools for native modules if needed
RUN apk add --no-cache python3 make g++

# Copy package files and install all deps
COPY package*.json ./
RUN npm install

# Copy full project
COPY . .

# Expose app port
EXPOSE 8080

# Run in dev mode with nodemon + ts-node
CMD ["npm", "run", "dev"]
