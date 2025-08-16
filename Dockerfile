# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
