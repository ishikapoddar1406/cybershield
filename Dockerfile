# Multi-stage Dockerfile for CyberShield
# Stage 1: Build the Vite React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:20-alpine
WORKDIR /app

# Copy and install server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server source code and assets
COPY server/ ./server/

# Copy built frontend assets so Express can serve them directly
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy forensic sample data
COPY samples/ ./samples/
COPY package*.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Seed database on first boot if needed and launch backend
EXPOSE 5000
CMD ["sh", "-c", "node server/src/db/seed.js && node server/src/server.js"]
