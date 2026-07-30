# Job Application Tracker — single web app image, no separate worker/scraper,
# so this uses Next's pruned "standalone" output (unlike re:Fresh, which keeps
# the full node_modules tree for its scraper scripts).

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Apply any pending migrations, then start the server. Safe to run on every
# boot: migrate deploy is a no-op when the schema is already up to date.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
