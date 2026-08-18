# ==========================================
# Multi-stage Dockerfile for Coolify Deployment
# ==========================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install all dependencies with memory optimizations
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm install --no-audit --no-fund

# Copy all source files
COPY . .

# Run production build (Vite + esbuild)
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built distribution from builder
COPY --from=builder /app/dist ./dist

# Create necessary runtime directories
RUN mkdir -p /app/tenants /app/backups

# Copy initial database & configs if present
COPY --from=builder /app/database.json ./database.json
COPY --from=builder /app/tenants ./tenants
COPY --from=builder /app/firebase*.json ./

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
