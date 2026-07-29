# manhnpc backend

Spring Boot 3 microservices backend for the **manhnpc** personal portfolio / life-archive website.
The React frontend (http://localhost:5173) talks to the API gateway at http://localhost:8090.

## Production deployment

Pushes to `main` that change `backend/**` run `.github/workflows/backend-cicd.yml`.
The workflow compiles all modules, validates the production Compose file, then
deploys to `/opt/manhnpc` on the VPS.

Required GitHub environment secrets for `production`:

- `VPS_HOST` — production VPS address
- `VPS_PORT` — normally `22`
- `VPS_USER` — normally `root`
- `VPS_PASSWORD` — VPS login password (prefer replacing with a deploy key later)
- `JWT_SECRET` — random secret of at least 32 characters
- `OWNER_PASSWORD` — initial owner password

The API is served through the existing Caddy container at
`https://portfolio-api.manhnpc.com`. Persistent H2 files and media uploads use
named Docker volumes and survive deployments.

## Architecture

```
                        ┌──────────────────────┐
                        │   React frontend     │
                        │  localhost:5173      │
                        └──────────┬───────────┘
                                   │ HTTP (CORS enabled)
                                   v
                        ┌──────────────────────┐
                        │     api-gateway      │
                        │  Spring Cloud GW     │
                        │      :8090           │
                        └──────────┬───────────┘
              lb:// routing via Eureka service discovery
        ┌───────────────┬──────────┼───────────────┬───────────────┐
        v               v          v               v               │
┌───────────────┐ ┌────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ auth-service  │ │ content-   │ │ media-      │ │ travel-     │   │
│    :8081      │ │ service    │ │ service     │ │ service     │   │
│ JWT + profile │ │   :8082    │ │   :8083     │ │   :8084     │   │
│ H2 in-memory  │ │ blog posts │ │ photos/     │ │ visited     │   │
│               │ │ H2         │ │ videos, H2  │ │ places, H2  │   │
└───────┬───────┘ └─────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
        │               │               │               │          │
        └───────────────┴───────┬───────┴───────────────┴──────────┘
                                v
                     ┌────────────────────┐
                     │  discovery-server  │
                     │   Eureka  :8761    │
                     └────────────────────┘
```

## Modules and ports

| Module            | Port | Description                                             |
|-------------------|------|---------------------------------------------------------|
| discovery-server  | 8761 | Netflix Eureka service registry                         |
| api-gateway       | 8080 | Spring Cloud Gateway (reactive), CORS, `lb://` routing  |
| auth-service      | 8081 | Login (JWT HS256), `/api/auth/me`, public `/api/profile`|
| content-service   | 8082 | Blog posts (markdown), tags, views, search, paging      |
| media-service     | 8083 | Photos and videos, multipart uploads (max 50MB)         |
| travel-service    | 8084 | Visited places with real coordinates, travel stats      |

Gateway routes:

| Path prefix       | Target service   |
|-------------------|------------------|
| `/api/auth/**`    | auth-service     |
| `/api/profile/**` | auth-service     |
| `/api/posts/**`   | content-service  |
| `/api/media/**`   | media-service    |
| `/api/travel/**`  | travel-service   |

## Requirements

- Java 21
- Maven 3.9+

## Build

```bash
cd backend
mvn -q -DskipTests package
```

## Run (order matters)

1. **discovery-server** first, wait for it to be up on :8761
2. all business services (**auth**, **content**, **media**, **travel**) in any order
3. **api-gateway** last

Option A — helper scripts on the built jars:

```powershell
# Windows
.\run-all.ps1
```

```bash
# Git Bash / Linux / macOS
./run-all.sh
```

Option B — manually per module:

```bash
mvn -pl discovery-server spring-boot:run
mvn -pl auth-service     spring-boot:run
mvn -pl content-service  spring-boot:run
mvn -pl media-service    spring-boot:run
mvn -pl travel-service   spring-boot:run
mvn -pl api-gateway      spring-boot:run
```

Eureka dashboard: http://localhost:8761

## Default credentials

| Username  | Password       |
|-----------|----------------|
| `${OWNER_USERNAME}` | `${OWNER_PASSWORD}` |

JWTs are HS256-signed, valid for 24h. All services share the same secret
(`jwt.secret` in each `application.yml`), so tokens issued by auth-service are
accepted by the write-protection filters of the other services.

## Sample requests

```bash
# Public profile
curl http://localhost:8090/api/profile

# Login -> returns {token, user}
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<OWNER_USERNAME>","password":"<OWNER_PASSWORD>"}'

# Save the token
TOKEN="<paste token here>"

# Who am I
curl http://localhost:8090/api/auth/me -H "Authorization: Bearer $TOKEN"

# Blog posts (paged, published only, newest first)
curl "http://localhost:8090/api/posts?page=0&size=5"
curl "http://localhost:8090/api/posts?tag=kafka"
curl "http://localhost:8090/api/posts?q=microservices"

# Single post by slug (increments views)
curl http://localhost:8090/api/posts/jwt-security-pitfalls

# Tag cloud
curl http://localhost:8090/api/posts/tags

# Create a post (JWT required)
curl -X POST http://localhost:8090/api/posts \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Hello world","content":"# Hi\nFirst post.","tags":"meta","category":"life","readingTime":1,"published":true}'

# Photos / videos
curl "http://localhost:8090/api/media/photos?category=travel"
curl http://localhost:8090/api/media/videos

# Upload a photo (JWT required, max 50MB, stored under ./uploads)
curl -X POST http://localhost:8090/api/media/photos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg" -F "title=Test upload" -F "category=life"

# Travel map data
curl http://localhost:8090/api/travel/locations
curl http://localhost:8090/api/travel/stats
```

## Notes

- All data is stored in **H2 in-memory** databases (`ddl-auto: create` + CommandLineRunner seeding),
  so every restart gives a fresh, fully-seeded state.
- H2 consoles are available on each service at `/h2-console` (JDBC URL `jdbc:h2:mem:<name>db`, user `sa`, empty password).
- Errors are returned as consistent JSON: `{timestamp, status, error, message, path}`.
- CORS for http://localhost:5173 is configured both at the gateway (global) and on each
  service (so direct access also works); the gateway dedupes duplicated CORS headers.
