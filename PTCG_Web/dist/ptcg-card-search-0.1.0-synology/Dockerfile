# PTCG Card Search - Docker for Synology NAS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for image processing and health checks
RUN apk add --no-cache \
    libc6-compat \
    wget \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/test-currency || exit 1

# Start the application
CMD ["npm", "start"]