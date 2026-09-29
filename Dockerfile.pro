# syntax=docker/dockerfile:1.7

# Imagen base con Corepack habilitado para gestionar pnpm
FROM node:24.21.0-trixie-slim AS base

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true

RUN corepack enable

# ---- Dependencias (dev + prod) ----
FROM base AS deps

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# ---- Build de la aplicación ----
FROM deps AS build

WORKDIR /usr/src/app

COPY . .

RUN pnpm run build

# Recorta node_modules a solo dependencias de producción de forma reproducible
RUN pnpm install --frozen-lockfile --prod

# ---- Imagen final de producción ----
FROM base AS prod

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]