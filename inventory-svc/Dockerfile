# Simple, production-only image for a plain JS service (no build step)
FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production
CMD ["node", "src/server.js"]
