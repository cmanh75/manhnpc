# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal "universe" website for the owner (alias `manhnpc`): public-facing photo/video gallery, blog, guestbook and an interactive 3D globe of visited places. Visitors browse; only the owner authenticates (JWT) for writes. Two independent halves:

- `frontend/` — React 19 SPA (Vite 8, TypeScript, Tailwind CSS v4, react-three-fiber, framer-motion, zustand)
- `backend/` — Maven multi-module Spring Boot 3.3 / Spring Cloud 2023 microservices (Java 21)

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
mvn -DskipTests package        # build all 6 services (must be BUILD SUCCESS)
mvn -q -pl api-gateway -DskipTests package   # rebuild a single module
.\run-all.ps1                  # start built jars in order (discovery → services → gateway)
```

Full stack one-liner from repo root: `.\start-all.ps1` (starts backend jars + Vite + opens browser).

**Windows note:** a running service holds a file lock on its jar — Maven fails to overwrite it. Kill the java process on that service's port before rebuilding (`netstat -ano | findstr :<port>` → `taskkill /F /PID <pid>`).

## Machine-specific quirks (important)

- **The API gateway runs on port 8090, NOT 8080** — Apache/XAMPP (`httpd`) permanently occupies 8080 on this machine. The Vite proxy, docs and scripts all assume 8090. Don't "fix" it back to 8080.
- All services set `eureka.instance.hostname: localhost`. Without it they register under the Hyper-V hostname `cmanh75.mshome.net`, which doesn't resolve, and every gateway route times out.
- After the gateway boots it returns 503 for ~30s until its Eureka registry sync completes. This is normal, not a bug.

## Architecture

### Backend topology

```
client → api-gateway :8090 (Spring Cloud Gateway, lb:// routes, CORS for :5173)
           ├── /api/auth/**, /api/profile → auth-service   :8081  (JWT HS256, BCrypt user)
           ├── /api/posts/**             → content-service :8082  (blog posts)
           ├── /api/media/**             → media-service   :8083  (photos/videos + uploads → ./uploads)
           ├── /api/travel/**            → travel-service  :8084  (visited places for the globe)
           └── /api/guestbook/**         → guestbook-service :8085 (visitor guestbook)
         discovery-server :8761 (Eureka)
```

- Every service: H2 in-memory DB, `ddl-auto: create`, seeded by a `CommandLineRunner` — data resets on every restart. Nothing is persistent except uploaded files.
- Shared HS256 `jwt.secret` string duplicated across each service's `application.yml`. auth-service issues tokens; the other services validate writes via a lightweight `JwtWriteProtectionFilter` (OPTIONS/GET pass freely so CORS preflight works).
- Owner credentials are supplied through environment variables. User table is `app_users` (`USER` is reserved in H2 2.x).
- guestbook-service is the exception to the write-protection rule: POST is public (visitors sign without accounts); only DELETE/PUT/PATCH require the JWT. FE owner state lives in the zustand store (`owner`), session persisted under localStorage `manhnpc.auth`, attached to requests by an axios interceptor.
- Consistent error shape everywhere via `@RestControllerAdvice`: `{timestamp, status, error, message, path}`.

### Frontend data layer — the load-bearing pattern

`src/lib/api.ts` wraps every request in `withFallback()`: try the gateway, on failure silently serve `src/lib/mock.ts` (which mirrors the backend contract 1:1) and back off re-probing for 30s. **The site must remain fully functional with the backend down.** When adding an endpoint, add the matching mock and keep both shapes in sync.

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
- Scripts (`start-all.ps1`, `backend/run-all.ps1`) reference jars named `<module>-1.0.0.jar`; version bumps must update them.
