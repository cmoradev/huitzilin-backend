# syntax=docker/dockerfile:1.7

# Imagen base con pnpm instalado explícitamente (sin corepack)
FROM node:24.21.0-trixie-slim AS base

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true

# Instala pnpm@11.25.0 explícitamente usando npm solo como bootstrap (sin corepack)
RUN npm install -g pnpm@11.25.0

# ---- Dependencias (dev + prod) ----
FROM base AS deps

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# BuildKit cache mount para /pnpm/store con sharing=locked
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile

# ---- Build de la aplicación ----
FROM deps AS build

WORKDIR /usr/src/app

COPY . .

RUN pnpm run build

# Recorta node_modules a solo dependencias de producción de forma reproducible
# BuildKit cache mount para /pnpm/store con sharing=locked
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prod

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
