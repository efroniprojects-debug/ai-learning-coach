# Backend Docker Image for Railway Deployment

FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy monorepo files
COPY package*.json ./
COPY tsconfig.json ./
COPY backend/ ./backend/
COPY frontend/src/types/ ./frontend/src/types/

# Install dependencies
RUN npm ci --omit=dev

# Build backend
WORKDIR /app/backend
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "dist/index.js"]
