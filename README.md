# Amit Center — Full Stack App

A full-stack web application for Amit Diagnostic Center with Hebrew + English UI.

**Stack:**
- **Frontend** — React 18 + Vite, served by nginx in production
- **Backend** — Node.js 20 + Express, with rate limiting + helmet
- **Database** — PostgreSQL 16

## Quick start (local)

```bash
# 1. Copy and adjust environment variables
cp .env.example .env
# Edit .env — change PGPASSWORD and ADMIN_KEY

# 2. Build and start everything
docker compose up --build

# 3. Open the app
open http://localhost:8080
```

That's it. One command spins up the database, runs the schema migration, builds and starts the backend, builds and serves the frontend.

## Project structure

```
amit-center-app/
├── docker-compose.yml      # orchestrates 3 services
├── .env / .env.example     # environment variables
├── frontend/
│   ├── Dockerfile          # multi-stage: node build → nginx serve
│   ├── nginx.conf          # SPA routing + /api proxy + security headers
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── i18n/           # Hebrew + English translations
│       ├── components/     # Header, HeroSlider, Services, etc.
│       └── styles/main.css
└── backend/
    ├── Dockerfile          # node:20-alpine
    ├── package.json
    ├── db/init.sql         # auto-loaded by postgres on first boot
    └── src/
        ├── server.js       # Express app
        ├── db.js           # pg pool + waitForDb
        └── routes/contact.js
```

## Services and ports

| Service  | Container port | Host port (default) | Notes |
|----------|----------------|---------------------|-------|
| frontend | 80             | 8080                | nginx, proxies /api → backend |
| backend  | 3000           | 3000                | Express API |
| db       | 5432           | 5432                | PostgreSQL |

Override host ports in `.env` (`FRONTEND_PORT`, `BACKEND_PORT`, `PG_PORT`).

## API

| Method | Endpoint            | Auth          | Purpose |
|--------|---------------------|---------------|---------|
| GET    | `/api/health`       | none          | Health probe (used by Docker healthcheck) |
| POST   | `/api/contact`      | none, rate-limited | Submit a contact inquiry |
| GET    | `/api/contact`      | `x-admin-key` header | List recent inquiries |

### Contact submit example

```bash
curl -X POST http://localhost:8080/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"דוגמה","phone":"050-1234567","email":"a@b.com","message":"שלום","language":"he"}'
```

### List inquiries (admin)

```bash
curl http://localhost:3000/api/contact -H "x-admin-key: $ADMIN_KEY"
```

## Development workflow

### Run backend with hot reload

```bash
cd backend
npm install
npm run dev   # uses --watch to restart on file changes
```

### Run frontend in dev mode (Vite HMR)

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

In dev, Vite proxies `/api` to `http://backend:3000` (set `VITE_API_URL=http://localhost:3000` for local non-Docker dev).

## Cloud deployment

The same `docker-compose.yml` works on any VPS that runs Docker Compose:
1. Provision a server (DigitalOcean, AWS Lightsail, Hetzner, etc.)
2. Install Docker + Docker Compose
3. Copy this repo, set production values in `.env`
4. Add a reverse proxy in front (Caddy / nginx / Cloudflare) for HTTPS
5. `docker compose up -d --build`

For managed deployments, frontend → static hosting (Vercel/Netlify), backend → any Node host (Render, Fly.io, Railway), database → managed Postgres (Neon, Supabase, RDS).

## Reset everything

```bash
docker compose down -v   # -v also removes the database volume
```

## Production checklist

- [ ] Strong `PGPASSWORD` and `ADMIN_KEY` in `.env`
- [ ] HTTPS in front of nginx (Let's Encrypt via Caddy or Cloudflare)
- [ ] Set `CORS_ORIGIN` to your real domain (not `*`)
- [ ] Configure a backup strategy for the `db_data` volume
- [ ] Add monitoring (logs to stdout are already correct for any log shipper)
