# 1. Base stage — shared dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# 2. Development stage
FROM base AS development
RUN npm install
COPY tsconfig.json ./
COPY nodemon.json ./
COPY src ./src
EXPOSE 5173
CMD ["npm", "run", "dev"]

# 3. Builder stage — This compiles the TypeScript
FROM base AS builder
# We need devDependencies (typescript) to build the app
RUN npm install 
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 4. Production stage — The final lean image
FROM base AS production
# Only install production dependencies
RUN npm ci --omit=dev
# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]