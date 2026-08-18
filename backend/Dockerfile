# Stage 1: Build and resolve dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Production runner
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Set up non-root user earlier
USER node
# Copy from builder with correct ownership
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
# Copy app source code
COPY --chown=node:node src/ ./src/
COPY --chown=node:node server.js ./

EXPOSE 8000
CMD ["npm", "start"]
