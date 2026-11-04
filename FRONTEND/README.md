# Serene EduHealth: Frontend

React 18 + Vite + Tailwind CSS frontend for **Serene EduHealth**, a school health management platform, built from the Figma design *Serene EduHealth Prototype*.

> Backend developer? Start with **[docs/BACKEND_API_CONTRACT.md](docs/BACKEND_API_CONTRACT.md)**.

## Screens

Landing (with pricing) · Sign in · Get on board · Forgot/Reset password · **Dashboard** · **Health Activity Tracker** · **Injury/Incident Reporting** (+ Incident Log) · **Reports & Insights** · **Training & Resources Library** · **School Profile** (General, Contact, Notifications, User Roles) · **SereneAI** chatbot.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173, runs on the built-in mock API (no backend needed)
```

Demo login (mock mode only): `admin1@nectarschools.com` / `password123`.

## Connect to the real backend

```bash
cp .env.example .env.local
# edit .env.local:
#   VITE_USE_MOCK=false
#   VITE_PROXY_TARGET=http://localhost:5000
npm run dev
```

| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK` | `true` in dev, `false` in production build | Use the in-memory mock API |
| `VITE_API_BASE_URL` | `/api` | API base path or full URL |
| `VITE_ASSET_BASE_URL` | empty | Prefix for uploaded-file paths returned by the API |
| `VITE_PROXY_TARGET` | `http://localhost:5000` | Dev proxy target for `/api` and `/uploads` |
| `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_PHONE` | placeholders | Shown in the Help popover |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` (the mock API is stripped out) |
| `npm run preview` | Serve `dist/` locally |
| `npm test` | Smoke test of the main journeys against the mock API |

## Brand images

The logo, photos and the SereneAI robot avatar are **not bundled** (they could not be downloaded from Figma). Every one has a clean fallback and is picked up automatically when you drop the file into `public/brand/`. See [public/brand/README.md](public/brand/README.md) for the file names and what to export from Figma.

## Production deployment

Build with `npm run build` and serve `dist/` as a single-page app (every path falls back to `index.html`).

**nginx (same origin, no CORS):**
```nginx
server {
  listen 80;
  root /var/www/serene/dist;
  location / { try_files $uri /index.html; }
  location /api/     { proxy_pass http://127.0.0.1:5000; }
  location /uploads/ { proxy_pass http://127.0.0.1:5000; }
}
```
**Vercel / Netlify:** `vercel.json` and `public/_redirects` are included for the SPA fallback. Set `VITE_API_BASE_URL` and `VITE_ASSET_BASE_URL` to your API's full URL and enable CORS on the API.

## Project structure

```
src/
  config/env.js          environment values
  lib/                   http client (axios), formatters, constants, file download
  services/              one small file per API area (the only place URLs live)
  context/               Auth and Toast providers
  hooks/                 useAsync, useDebounce, useClickOutside
  components/
    ui/                  Button, Field, Modal, Tabs, Badge, Pagination, ...
    brand/               Logo and image slots with fallbacks
    layout/              AppShell (green sidebar + top bar), PublicLayout, AuthCard
    charts/              dependency-free SVG/CSS charts
    common/              Avatar, StatTile, PageHeader, ProtectedRoute
  pages/
    public/              Landing, Login, Signup, ForgotPassword, ResetPassword
    app/                 Dashboard, ActivityTracker, IncidentReport, IncidentLog, Reports, Training, SchoolProfile, AiChat
  mocks/mockAdapter.js   in-memory fake API (also a reference implementation)
tests/smoke.test.jsx
docs/BACKEND_API_CONTRACT.md
```

## Design tokens (from Figma)

Brand green `#27AB4D`, dark green `#118733`, mint `#D7FFD7` to `#F2FFF2`, border `#E7EBF3`, text `#222222`, muted `#8F8F8F`. Font: Inter. Floating rounded shell (70 px radius), green sidebar, pill buttons. Tokens live in `tailwind.config.js` and `src/index.css`.

## Notes

- Responsive: the sidebar becomes a slide-in menu on tablets and phones.
- Session: JWT in `localStorage`, restored through `GET /auth/me`; any 401 signs the user out.
- Mock data lives in memory and resets on page reload.
