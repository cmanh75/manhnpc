# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal "universe" website for the owner (alias `manhnpc`): public-facing photo/video gallery, blog, guestbook and an interactive 3D globe of visited places. Visitors browse; only the owner authenticates (JWT) for writes. Two independent halves:

- `frontend/` — React 19 SPA (Vite 8, TypeScript, Tailwind CSS v4, react-three-fiber, framer-motion, zustand)
- `backend/` — single Spring Boot 3.3 monolith (Java 21, Maven)

## Commands

### Frontend (`cd frontend`)

```bash
npm run dev          # Vite dev server on :5173 (proxies /api → :8090)
npx tsc -b           # type-check (no emit)
npm run build        # tsc + production build
node scripts/generate-globe-dots.mjs   # regenerate public/land-dots.json from public/land-110m.json
```

There are no frontend tests. Verification = type-check + build + loading the site.

### Backend (`cd backend`)

```powershell
mvn -DskipTests package        # build the one jar (must be BUILD SUCCESS)
.\run-all.ps1                  # start the built jar
```

Full stack one-liner from repo root: `.\start-all.ps1` (starts the backend jar + Vite + opens browser).

**Windows note:** a running instance holds a file lock on the jar — Maven fails to overwrite it. Kill the java process on port 8090 before rebuilding (`netstat -ano | findstr :8090` → `taskkill /F /PID <pid>`).

## Machine-specific quirks (important)

- **The backend runs on port 8090, NOT 8080** — Apache/XAMPP (`httpd`) permanently occupies 8080 on this machine. The Vite proxy, docs and scripts all assume 8090. Don't "fix" it back to 8080.

## Architecture

### Backend topology

Single Spring Boot process on `:8090`, package root `com.manhnpc`. Formerly 9 separate Spring Cloud microservices (discovery-server, api-gateway, auth/content/media/travel/guestbook/journal/audit-service) behind a gateway — collapsed into one monolith to cut per-JVM RAM overhead on the VPS, since none of the domains ever called each other over HTTP (the gateway/Eureka existed purely for routing, not inter-service RPC). Domain code kept its original per-service packages, now siblings under one process:

```
com.manhnpc
  ├── auth/        /api/auth/**, /api/profile   — JWT HS256 issuance, BCrypt user, owner seeded from env
  ├── content/     /api/posts/**                — blog posts
  ├── media/       /api/media/**                — photos/videos; uploads stream straight to Cloudflare R2
  ├── travel/      /api/travel/**                — visited places for the globe
  ├── guestbook/   /api/guestbook/**             — visitor guestbook (POST is public)
  ├── journal/     /api/journal/**               — private journal, owner-only on every method incl. GET
  ├── audit/       /api/audit/**                 — visit logging (POST /visit public, reads owner-only)
  └── common/      security (JwtService, JwtAuthFilter, SecurityConfig), web.error (ApiExceptionHandler
                   + shared NotFoundException/BadRequestException/UnauthorizedException), storage
                   (R2StorageService, shared by media + journal)
```

- One H2 DB, file-backed at `backend/data/appdb` (`ddl-auto: update`) so data survives restarts; each domain's `DataSeeder` only inserts its demo rows the first time a table is empty. Prod overrides the URL/ddl-auto via `SPRING_DATASOURCE_URL`/`SPRING_JPA_HIBERNATE_DDL_AUTO` env vars to its own persistent volume. Table names are namespaced per domain already (`app_users`, `posts`, `photos`/`videos`, `visited_places`, `guest_entries`, `journal_entries`, `visit_logs`) so they share one schema with no collisions. `USER` is reserved in H2 2.x, hence `app_users`.
- Auth: `common.security.SecurityConfig` is one Spring Security filter chain (`authorizeHttpRequests`) — this is what used to be 7 independent per-service JWT filters (write-protected, guestbook's delete-only, journal's all-methods, audit's inverse-protected). Check that class for the exact path/method → access table before changing what's public vs owner-only.
- Owner credentials come from environment variables, seeded once (`auth.config.OwnerSeeder`, only fires if the user table is empty) — changing the password via `PUT /api/auth/password` persists in the DB and is not overwritten by the env var on restart.
- media/journal uploads stream straight to a Cloudflare R2 bucket via the shared `common.storage.R2StorageService` (AWS SDK v2 S3 client, endpoint override to `https://<account>.r2.cloudflarestorage.com`). `Photo`/`Video.url` stores the full public R2 URL and `storageKey` the R2 object key (used to delete the object on `DELETE /api/media/photos|videos/{id}`); seeded/demo rows have no `storageKey` since they point at external picsum/sample URLs. Needs `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` env vars — all default to empty locally so the app still boots without R2 configured (uploads just fail until set).
- FE owner state lives in the zustand store (`owner`), session persisted under localStorage `manhnpc.auth`, attached to requests by an axios interceptor.
- Consistent error shape everywhere via `common.web.error.ApiExceptionHandler`: `{timestamp, status, error, message, path}`.

### Frontend data layer

`src/lib/api.ts` calls the backend directly (proxied via `/api`) — there is no mock/fallback dataset. If the backend is unreachable the call throws and callers fall back to an empty/loading state instead of fabricated content.

Known contract mismatch handled here: content-service returns post `tags` as a comma-joined string; `normalizePost()` in api.ts converts to `string[]`. Photos/videos/places/profile match the TS types in `src/lib/types.ts` exactly.

Guestbook and likes are localStorage-only (`guestbook`/`likes` exports in api.ts) — there is no backend guestbook service yet.

### Frontend structure

- `src/pages/` — one component per route; routing + shell assembly in `App.tsx` (the `/globe` route is a fixed fullscreen scene with no footer).
- `src/components/globe/` — `Earth.tsx` (land-dot points cloud, atmosphere, markers, arcs — all custom GLSL shaders), `GlobeScene.tsx` (Canvas, OrbitControls, camera fly-to rig, bloom), `PlaceCard.tsx`. Land dots load from `public/land-dots.json` (pregenerated; flat `[lat, lng, ...]` array). Selection state flows through the zustand store (`useAppStore.selectedPlace`), which is how the timeline chips, markers and camera rig stay in sync.
- `src/components/layout/` — Navbar, Footer, Preloader (boot animation), CommandPalette (Ctrl+K), CustomCursor, Backdrop (pure-CSS ambient background incl. meteors), SmoothScroll (Lenis — deliberately disabled on `/globe` where the wheel belongs to OrbitControls zoom).
- `src/components/ui/` — shared primitives: `PageShell`, `SectionHeading`, `Reveal`, `CountUp`, `LikeButton`, `BackendBadge` (index.tsx); `TiltCard`/`Magnetic`/`MatrixRain` (Effects.tsx); brand SVGs in `BrandIcons.tsx` — **lucide-react v1 removed brand icons** (Github/Linkedin), don't import them from lucide.

### Design system

All theme tokens live in `src/index.css` under Tailwind v4's `@theme` (colors `void/space/panel/ink/muted/faint` + neon accents `cyan/violet/pink/mint/amber`, fonts `display/body/mono`, keyframe animations). Reusable effect classes (`glass`, `glass-strong`, `text-gradient`, `border-beam`, `grid-bg`, `skeleton`, `prose-dev` for markdown) are defined there too — extend that file rather than inlining new one-off styles. Aesthetic: dark space/terminal theme, `$ command`-style section headings, JetBrains Mono for meta text.

## Gotchas

- Vite 8 (rolldown): `manualChunks` must be a function, not an object (see `vite.config.ts`).
- `gl_PointSize` is in physical pixels — the dot shader multiplies by `gl.getPixelRatio()` each frame; dot size constants in `Earth.tsx` assume this.
- Scripts (`start-all.ps1`, `backend/run-all.ps1`, `backend/run-all.sh`) reference the jar `manhnpc-backend-1.0.0.jar`; version bumps must update them.
