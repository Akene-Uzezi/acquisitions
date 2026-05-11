# Base stage — shared dependencies
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage — used by docker-compose.dev.yml
FROM base AS development
RUN npm install
COPY tsconfig.json ./
COPY nodemon.json ./
COPY src ./src
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]