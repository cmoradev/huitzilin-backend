# Huitzilin Backend

API backend del proyecto Huitzilin basada en NestJS, ejecutada en entorno de
desarrollo mediante Docker Compose.

## Requisitos

- Docker Engine 24+
- Docker Compose v2 (incluido con Docker Desktop / `docker compose-plugin`)
- BuildKit habilitado (necesario para el `Dockerfile.dev`, que usa
  `mount=type=cache`)

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables.
**No incluyas valores reales en el repositorio** (`.env` está excluido en
`.gitignore`).

| Variable           | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `DB_NAME`          | Nombre de la base de datos PostgreSQL.            |
| `DB_USER`          | Usuario de PostgreSQL.                            |
| `DB_PASS`          | Contraseña de PostgreSQL.                         |
| `DB_HOST`          | Host de PostgreSQL (dentro de Compose: `postgres-server`). |
| `DB_PORT`          | Puerto de PostgreSQL (por defecto `5432`).        |
| `IAM_ACCESS_KEY`   | Access key del servicio de almacenamiento (S3-compatible). |
| `IAM_SECRET_KEY`   | Secret key asociada al access key anterior.       |

> Las credenciales IAM son necesarias para el servicio `storage-server`. Si
> no las defines, el contenedor arrancará igualmente pero las operaciones
> contra el bucket fallarán.

## Flujo de desarrollo

Los comandos deben ejecutarse desde la raíz del repositorio.

### 1. Apagar servicios previos

```bash
docker compose -f compose.dev.yaml down
```

### 2. Construir (o reconstruir) las imágenes

```bash
docker compose -f compose.dev.yaml build
```

### 3. Levantar el entorno en modo watch

```bash
docker compose -f compose.dev.yaml up --watch
```

`--watch` habilita la sincronización de `src/` y `test/` y reconstruye
automáticamente cuando cambia `package.json` (definido en `develop.watch`
del Compose).

## Servicios y puertos

| Servicio           | Imagen / Build                       | Puerto host → contenedor |
| ------------------ | ------------------------------------ | ------------------------ |
| `postgres-server`  | `postgres:18.4-trixie`               | `5432 → 5432`            |
| `apex-server`      | Build local (`Dockerfile.dev`)       | `4000 → 3000`            |
| `storage-server`   | `registry.digitalocean.com/softmora/utils:storage-ms-90e7fcf` | `4100 → 3000` |

## Datos persistentes

El volumen `huitzilin-db` (definido al final de `compose.dev.yaml`) conserva
los datos de PostgreSQL entre reinicios. Para un reset completo ejecuta:

```bash
docker compose -f compose.dev.yaml down -v
```
