# Enterprise Loan Management System (LMS) — Docker Deployment Guide

This guide details running the FinTech Loan Management System locally or on a production server using Docker and Docker Compose.

---

## 1. Quick Start (Windows)

The repository provides a complete automation script `run.bat` in the project root:

```cmd
run.bat
```

### Supported Direct CLI Commands:
- `run.bat start` — Build images and start PostgreSQL + Next.js in detached mode
- `run.bat stop` — Gracefully stop all containers
- `run.bat restart` — Restart existing containers
- `run.bat logs` — Stream live logs from all containers
- `run.bat status` — Show running containers and port bindings
- `run.bat seed` — Re-execute initial master data & administrator seeding
- `run.bat reset` — Factory reset (wipe volume & rebuild fresh)

---

## 2. Quick Start (Cross-Platform / Linux / macOS)

### Build & Start Stack:
```bash
docker compose up --build -d
```

### View Real-Time Logs:
```bash
docker compose logs -f web
```

### Stop Stack:
```bash
docker compose down
```

---

## 3. Architecture & Container Layout

The stack is defined in `docker-compose.yml`:

| Service | Container Name | Base Image | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `loan_ms_postgres` | `postgres:16-alpine` | `5432` | `5432` | PostgreSQL database with persistent volume |
| **`web`** | `loan_ms_app` | `node:20-alpine` (multi-stage) | `3000` | `3000` | Next.js app + Prisma ORM + API Route Handlers |

### Automated Startup & Database Synchronization:
When `web` starts up, its entrypoint script (`frontend/docker-entrypoint.sh`):
1. **Connectivity check**: Probes PostgreSQL with exponential backoff until it is ready.
2. **Schema synchronization**: Executes `prisma db push` to ensure all 30+ tables and relations exist.
3. **Smart auto-seeding**: Checks if any users exist in the database. If the database is fresh (0 users), it automatically executes `prisma/seed.ts` to provision initial branches, roles, loan products, and the administrator account. If users already exist, it preserves existing loan portfolio data.
4. **Starts Next.js**: Boots the Next.js server bound to `0.0.0.0:3000`.

---

## 4. Default Access Credentials

Once the containers are up:

- **Web Application Portal**: [http://localhost:3000](http://localhost:3000)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Database Health Check**: [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db)
- **Default Master Admin Email**: `admin@fintechlms.in` (or username: `admin`)
- **Default Master Password**: `LmsAdmin@2026`

---

## 5. Environment Variables Reference

These are pre-configured in `docker-compose.yml`:

| Variable | Default Docker Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/loan_ms_db?schema=public` | Prisma database connection string |
| `PGHOST` | `postgres` | Hostname of Postgres container on internal bridge network |
| `PGPORT` | `5432` | Postgres port |
| `PGUSER` | `postgres` | Postgres user |
| `PGPASSWORD` | `postgres` | Postgres password |
| `PGDATABASE` | `loan_ms_db` | Database name |
| `NODE_ENV` | `production` | Production runtime optimization |
| `PORT` | `3000` | HTTP listening port |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App base URL for redirects & sitemaps |
| `AUTH_SECRET` | *(internal key)* | Secret used for session / JWT verification |
| `FORCE_SEED` | `"false"` | Set to `"true"` to force wipe & reseed on start |

---

## 6. Useful Operations

### Run Prisma Studio inside Docker:
```bash
docker exec -it loan_ms_app npx prisma studio --port 5555 --browser none
```

### Access PostgreSQL via psql:
```bash
docker exec -it loan_ms_postgres psql -U postgres -d loan_ms_db
```

### Connect with Local GUI Client (DBeaver, TablePlus, pgAdmin):
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `loan_ms_db`
