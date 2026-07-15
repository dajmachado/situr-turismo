# Base glibc (não Alpine) — better-sqlite3 tem binário pré-compilado pra
# glibc; musl arriscaria cair em compilação nativa dentro do build.
FROM node:20-bookworm-slim AS builder
WORKDIR /app
# better-sqlite3 não achou binário pré-compilado pra essa combinação de
# plataforma/libc e caiu pra compilar do zero via node-gyp — precisa de
# python3/make/g++, ausentes na imagem slim por padrão.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
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
