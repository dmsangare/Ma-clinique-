# ---- build ----
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ---- runtime ----
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
# On garde node_modules complet : entrypoint.sh a besoin du CLI prisma pour "migrate deploy".
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p /app/data /app/backups && chown -R node:node /app
USER node
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.cjs"]
