# Base glibc (não Alpine) — better-sqlite3 tem binário pré-compilado pra
# glibc; musl arriscaria cair em compilação nativa dentro do build.
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
