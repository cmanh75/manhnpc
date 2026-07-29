# manhnpc — Personal Universe 🌏

A self-hosted personal universe: an interactive 3D Earth of every place I've visited, a photo gallery, videos, long-form writing and a guestbook — **me as the main character, guests welcome to explore**.

```
┌─────────────────────┐         ┌──────────────────────────────────────────────┐
│      FRONTEND       │         │                 BACKEND                      │
│  React 19 + Vite 8  │  /api   │        Spring Cloud Gateway :8090            │
│  Three.js (R3F)     │ ──────▶ │   ┌────────┬─────────┬────────┬─────────┐    │
│  Tailwind CSS v4    │         │   │  auth  │ content │ media  │ travel  │    │
│  Framer Motion      │         │   │ :8081  │  :8082  │ :8083  │  :8084  │    │
│  localhost:5173     │         │   └────────┴─────────┴────────┴─────────┘    │
└─────────────────────┘         │          Eureka Discovery :8761              │
                                └──────────────────────────────────────────────┘
```

## Quick start

### Frontend (works standalone — no backend needed)

```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

The frontend has a **graceful-degradation API layer**: when the gateway at `:8090` is unreachable it silently falls back to a built-in mock dataset, so the whole site works offline. A status pill on the homepage shows `microservices: online` vs `offline mode: mock data`.

### Backend (Java 21 + Maven)

```powershell
cd backend
mvn -DskipTests package     # build all 6 services
.\run-all.ps1               # starts discovery → services → gateway
```

Or start manually in order: `discovery-server` → (`auth`, `content`, `media`, `travel`) → `api-gateway`. See `backend/README.md` for full docs, curl samples and the ASCII architecture diagram.

| Service | Port | Purpose |
|---|---|---|
| discovery-server | 8761 | Eureka service registry |
| api-gateway | 8090 | Single entry point, routing + CORS |
| auth-service | 8081 | JWT login, public profile |
| content-service | 8082 | Blog posts (markdown) |
| media-service | 8083 | Photos & videos + file uploads |
| travel-service | 8084 | Visited places for the globe |
| guestbook-service | 8085 | Visitor guestbook (public POST, owner-moderated) |

**Owner login:** credentials are supplied through `OWNER_USERNAME` and
`OWNER_PASSWORD` when the backend starts (JWT, 24h). All GET endpoints are
public; writes require the token, except guestbook POST which is open to
visitors. Logged-in owners get an `owner` chip in the navbar and can delete
guestbook entries.

## Frontend highlights

- **The Globe** (`/globe`) — 9,015 land dots sampled from real world-atlas topojson, rendered as a single `THREE.Points` draw call with a custom twinkle shader. Fresnel atmosphere, pulsing sonar markers with light pillars, bezier journey arcs with traveling comets, bloom post-processing, camera fly-to on selection, auto-rotate with idle resume.
- **Design system** — Tailwind v4 `@theme` tokens: deep-space palette, Space Grotesk / Inter / JetBrains Mono, glassmorphism, aurora backdrop, blueprint grid, animated conic border-beam cards, film grain.
- **Terminal soul** — boot-sequence preloader, `$ command` section headings, typewriter hero, `⌘K` command palette.
- **Micro-interactions** — custom cursor with lagging glow ring, reveal-on-scroll, count-up stats, like buttons (localStorage), reading progress bar, masonry gallery with keyboard-navigable lightbox.
- **Guestbook** — visitors sign via guestbook-service (falls back to localStorage offline); the owner moderates entries after logging in.
- **Motion layer** — Lenis inertial smooth-scrolling, scroll-linked hero parallax, decrypt-style text scramble on headings, shooting stars.

## Project layout

```
manhnpc/
├── frontend/            # React SPA (Vite, TS, Tailwind v4, R3F)
│   ├── scripts/         # generate-globe-dots.mjs (topojson → land-dots.json)
│   └── src/
│       ├── components/  # globe/, layout/, ui/
│       ├── pages/       # Home, Globe, Gallery, Videos, Blog, Guestbook, About
│       ├── lib/         # api.ts (fallback layer), mock.ts, types.ts
│       └── store/       # zustand
└── backend/             # Maven multi-module Spring Boot 3.3 / Spring Cloud 2023
```
