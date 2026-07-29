import type { VisitedPlace, Post, Photo, Video, Profile, TravelStats } from './types'

/**
 * Mock dataset mirroring the backend contract 1:1.
 * The API layer falls back to this data whenever the gateway
 * at :8080 is unreachable, so the site is always fully alive.
 */

export const mockPlaces: VisitedPlace[] = [
  { id: 1, name: 'Hanoi', country: 'Vietnam', countryCode: 'VN', lat: 21.0285, lng: 105.8542, visitedAt: '2019-01-01', description: 'Home base. Where every journey starts and ends — motorbikes, egg coffee and a thousand years of history.', highlight: 'Home is where the phở is', color: '#22d3ee', photosCount: 120, rating: 5 },
  { id: 2, name: 'Sa Pa', country: 'Vietnam', countryCode: 'VN', lat: 22.3364, lng: 103.8438, visitedAt: '2019-04-14', description: 'Rice terraces stacked into the clouds. Trekked Fansipan and lost a shoe to the mud.', highlight: 'Clouds below my feet on Fansipan', color: '#34d399', photosCount: 43, rating: 5 },
  { id: 3, name: 'Da Nang', country: 'Vietnam', countryCode: 'VN', lat: 16.0544, lng: 108.2022, visitedAt: '2019-08-02', description: 'Golden Bridge, Marble Mountains, and the best bánh xèo on the central coast.', highlight: 'Sunrise ride over Hải Vân Pass', color: '#fbbf24', photosCount: 58, rating: 5 },
  { id: 4, name: 'Ho Chi Minh City', country: 'Vietnam', countryCode: 'VN', lat: 10.8231, lng: 106.6297, visitedAt: '2020-01-20', description: 'The city that never sleeps — rooftop cafés, Bùi Viện chaos and cơm tấm at 3am.', highlight: 'Cơm tấm at 3am hits different', color: '#f472b6', photosCount: 66, rating: 4 },
  { id: 5, name: 'Bangkok', country: 'Thailand', countryCode: 'TH', lat: 13.7563, lng: 100.5018, visitedAt: '2022-06-11', description: 'First trip abroad after the pandemic. Temples, tuk-tuks and Chatuchak market marathons.', highlight: 'First stamp in the new passport', color: '#a78bfa', photosCount: 51, rating: 4 },
  { id: 6, name: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lng: 103.8198, visitedAt: '2022-11-03', description: 'Gardens by the Bay glowing at night felt like walking through a sci-fi render.', highlight: 'Supertrees look like a shader demo', color: '#22d3ee', photosCount: 39, rating: 5 },
  { id: 7, name: 'Kuala Lumpur', country: 'Malaysia', countryCode: 'MY', lat: 3.139, lng: 101.6869, visitedAt: '2023-03-18', description: 'Petronas Towers at midnight, Batu Caves at dawn, and endless nasi lemak in between.', highlight: '272 rainbow steps at Batu Caves', color: '#34d399', photosCount: 34, rating: 4 },
  { id: 8, name: 'Bali', country: 'Indonesia', countryCode: 'ID', lat: -8.3405, lng: 115.092, visitedAt: '2023-09-07', description: 'Worked remotely from Canggu for two weeks. Surfed badly, coded well.', highlight: 'Deployed to prod from a beach café', color: '#fbbf24', photosCount: 72, rating: 5 },
  { id: 9, name: 'Seoul', country: 'South Korea', countryCode: 'KR', lat: 37.5665, lng: 126.978, visitedAt: '2024-04-05', description: 'Cherry blossoms along Han River, late-night tteokbokki, and the Gangnam tech scene.', highlight: 'Cherry blossom snow in Yeouido', color: '#f472b6', photosCount: 64, rating: 5 },
  { id: 10, name: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503, visitedAt: '2024-11-22', description: 'Akihabara, teamLab Planets, and a 7-Eleven egg sando that changed my worldview.', highlight: 'teamLab felt like living inside WebGL', color: '#a78bfa', photosCount: 98, rating: 5 },
  { id: 11, name: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093, visitedAt: '2025-07-19', description: 'First time south of the equator. Opera House, Bondi-to-Coogee walk, flat whites.', highlight: 'Winter in July broke my brain', color: '#34d399', photosCount: 47, rating: 4 },
  { id: 12, name: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522, visitedAt: '2026-05-30', description: 'Finally, Europe. Louvre queues, midnight baguettes, and the Eiffel Tower sparkling on the hour.', highlight: 'Wrote code in a 17th-century café', color: '#f472b6', photosCount: 85, rating: 5 },
]

export const mockTravelStats: TravelStats = {
  countries: 9,
  places: 12,
  firstTrip: '2019-01-01',
  latestTrip: '2026-05-30',
}

const md = (s: TemplateStringsArray) => s[0].trim()

export const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Designing Resilient Microservices with Spring Cloud',
    slug: 'resilient-microservices-spring-cloud',
    excerpt: 'Circuit breakers, service discovery and the hard-earned lessons of running distributed systems in production at telco scale.',
    content: md`
## The problem with distributed systems

The first rule of distributed systems: **the network is not reliable**. The second rule: you will forget the first rule, and production will remind you.

At work we run dozens of Spring Boot services behind a gateway. Here is the architecture that survived contact with reality.

### Service discovery

Hardcoding hosts is a death sentence. Eureka gives every service a heartbeat:

\`\`\`yaml
eureka:
  client:
    service-url:
      defaultZone: http://discovery:8761/eureka
\`\`\`

The gateway resolves \`lb://content-service\` at runtime, so instances can come and go freely.

### Circuit breakers

When a downstream service degrades, the worst thing you can do is keep hammering it. Resilience4j lets calls fail fast:

\`\`\`java
@CircuitBreaker(name = "media", fallbackMethod = "cachedMedia")
public List<Photo> photos() { ... }
\`\`\`

> A circuit breaker is not about the service that failed. It is about protecting every service that did not.

### What actually matters

1. **Timeouts everywhere** — the default of "infinite" is a lie waiting to happen.
2. **Idempotency keys** — retries without them are just distributed data corruption.
3. **Observability first** — if you cannot trace a request across services, you do not have microservices, you have a murder mystery.

The point of microservices is not that they never fail. It is that they fail *small*.
`,
    coverImage: 'https://picsum.photos/seed/resilient-microservices/1200/630',
    tags: ['spring-boot', 'microservices', 'architecture'],
    category: 'engineering',
    readingTime: 7,
    published: true,
    createdAt: '2026-06-14T09:30:00',
    updatedAt: '2026-06-14T09:30:00',
    views: 1284,
  },
  {
    id: 2,
    title: 'Three.js Tricks for a Buttery 60fps Globe',
    slug: 'threejs-60fps-globe',
    excerpt: 'How I render 9,000 land dots, glowing markers and animated arcs on a spinning Earth without melting the GPU.',
    content: md`
## One draw call to rule them all

The globe on this very site renders ~9,000 dots. Naively adding 9,000 meshes gives you 9,000 draw calls and a slideshow. The fix is a single \`THREE.Points\` with a custom shader:

\`\`\`glsl
// vertex shader — subtle per-dot twinkle
float tw = 0.75 + 0.25 * sin(uTime * 1.5 + aSeed * 6.28);
gl_PointSize = uSize * tw * (300.0 / -mvPosition.z);
\`\`\`

### The atmosphere is a lie (a beautiful one)

Real atmospheric scattering is expensive. A fresnel-powered backside sphere is 12 lines and looks 95% as good:

\`\`\`glsl
float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
gl_FragColor = vec4(glowColor, 1.0) * intensity;
\`\`\`

### Arcs that feel alive

Journey arcs are cubic Béziers lifted off the surface. Animate the draw range, not the geometry — the GPU never re-uploads a byte.

### The checklist

- Merge everything mergeable; instance the rest
- \`powerPreference: 'high-performance'\` on the renderer
- Damped controls — momentum sells the physicality
- Never, ever create objects inside \`useFrame\`

Frame budget is 16ms. Spend it on beauty, not on garbage collection.
`,
    coverImage: 'https://picsum.photos/seed/threejs-globe/1200/630',
    tags: ['threejs', 'webgl', 'react', 'performance'],
    category: 'frontend',
    readingTime: 6,
    published: true,
    createdAt: '2026-04-02T21:15:00',
    updatedAt: '2026-04-03T08:00:00',
    views: 2891,
  },
  {
    id: 3,
    title: 'From Monolith to Microservices: A War Story',
    slug: 'monolith-to-microservices-war-story',
    excerpt: 'We split a ten-year-old monolith into services without stopping the release train. Here is what the migration guides never tell you.',
    content: md`
## The monolith was not the enemy

Let me say something unpopular: the monolith worked. It shipped features for a decade. The problem was not the architecture — it was that **forty engineers were stepping on each other in one codebase**.

### The strangler fig, for real this time

We did not rewrite. We strangled:

1. Put a gateway in front of the monolith. Day one, it proxies 100% of traffic.
2. Pick the seam with the fewest tangled dependencies (for us: notifications).
3. Build the service, shadow the traffic, compare outputs for two weeks.
4. Flip the route. Keep the old code path behind a feature flag for one more release.
5. Repeat for three years. Yes, years.

### What the guides skip

- **The database is the real monolith.** Splitting code is easy; splitting a schema with 400 foreign keys is archaeology.
- **Distributed transactions will find you.** We chose sagas with compensation. Debugging a half-completed saga at 2am is a rite of passage.
- **Conway's law is undefeated.** We reorganized teams *before* splitting services, and it was the single highest-leverage decision of the project.

> Microservices are a tax you pay for organizational scale. If the org is small, do not pay the tax.

Would I do it again? Yes — but only because we had the scale to justify it, and a rollback plan for every single step.
`,
    coverImage: 'https://picsum.photos/seed/monolith-migration/1200/630',
    tags: ['architecture', 'microservices', 'war-story'],
    category: 'engineering',
    readingTime: 9,
    published: true,
    createdAt: '2026-02-18T14:00:00',
    updatedAt: '2026-02-18T14:00:00',
    views: 3407,
  },
  {
    id: 4,
    title: 'JWT Security Pitfalls I Keep Seeing in Code Reviews',
    slug: 'jwt-security-pitfalls',
    excerpt: 'The alg:none attack, tokens that never die, secrets in git — a field guide to the JWT mistakes that keep pentesters employed.',
    content: md`
## Your token is a promise, not a session

A JWT is a signed statement: "the auth service vouched for this user at this time." Everything that goes wrong with JWTs comes from forgetting that.

### Pitfall 1 — trusting the header

The token's header says which algorithm to verify with. Attacker sets \`"alg": "none"\`, some libraries happily skip verification. **Pin the algorithm server-side:**

\`\`\`java
Jwts.parser().verifyWith(key)   // key implies HS256 — the token does not choose
\`\`\`

### Pitfall 2 — immortal tokens

No expiry means a leaked token is a permanent skeleton key. Short-lived access tokens (15 min) + refresh rotation is the boring, correct answer.

### Pitfall 3 — the secret is "secret"

I have seen HS256 secrets that were literally the string \`secret\`, committed to git. Use 256 bits of real entropy, load from environment, rotate on a schedule.

### Pitfall 4 — putting the crown jewels in the payload

The payload is **base64, not encryption**. Anyone with the token reads everything in it. Claims are for identifiers, never for PII.

### The checklist

- [x] Pin algorithms server-side
- [x] 15-minute access tokens, rotating refresh tokens
- [x] 256-bit secrets from env, never from git
- [x] IDs in claims, PII in the database
- [x] Clock skew tolerance of seconds, not minutes

Auth is the one place where boring is a feature.
`,
    coverImage: 'https://picsum.photos/seed/jwt-pitfalls/1200/630',
    tags: ['security', 'jwt', 'spring-security'],
    category: 'security',
    readingTime: 8,
    published: true,
    createdAt: '2025-11-09T10:45:00',
    updatedAt: '2025-11-09T10:45:00',
    views: 4102,
  },
  {
    id: 5,
    title: 'Why I Built My Own Digital Garden Instead of Using Instagram',
    slug: 'why-digital-garden',
    excerpt: 'Owning your memories beats renting an audience. On building a personal universe where the algorithm is just... you.',
    content: md`
## Renting vs. owning

Every photo I posted to social platforms lives in someone else's database, ranked by someone else's algorithm, shown to people someone else chose. One day the platform pivots to video, or ads, or AI slop — and a decade of memories becomes collateral.

So I built this place.

### The shape of a personal universe

- A **globe** of everywhere I have been, because a map is the most honest autobiography.
- A **gallery** that shows photos in the order *I* choose, at the quality *I* choose.
- **Writing** that does not compete with an infinite feed for attention.
- A **guestbook**, because the web used to be personal and I miss that.

### The stack is the point (and also not)

Yes, it is over-engineered — six Spring Boot services for a personal site is objectively absurd, and I regret nothing. This site is also my playground: every pattern I want to learn gets tried here first, where the only SLA is my own curiosity.

> Build a home on the web. Rent the billboards if you must, but build a home.

### What "done" looks like

Never. A garden is not a product launch; it grows. Some corners will be overgrown, some freshly planted. That is the feature.
`,
    coverImage: 'https://picsum.photos/seed/digital-garden/1200/630',
    tags: ['meta', 'indie-web', 'philosophy'],
    category: 'life',
    readingTime: 5,
    published: true,
    createdAt: '2026-07-01T20:00:00',
    updatedAt: '2026-07-01T20:00:00',
    views: 1876,
  },
  {
    id: 6,
    title: 'Kafka Exactly-Once Semantics in Practice',
    slug: 'kafka-exactly-once-in-practice',
    excerpt: 'Exactly-once is real, but it is not magic. Transactions, idempotent producers, and the fine print nobody reads.',
    content: md`
## The three lies of messaging

At-most-once loses data. At-least-once duplicates it. Exactly-once... has fine print.

Kafka's exactly-once semantics (EOS) are genuinely real since 0.11, but they cover **Kafka-to-Kafka** pipelines. The moment your consumer writes to Postgres or calls an HTTP API, you are back in at-least-once land unless you do the work.

### The producer side

\`\`\`properties
enable.idempotence=true
transactional.id=payment-processor-1
\`\`\`

Idempotent producers deduplicate retries within a session. Transactions extend that across partitions and the consumer offset commit — the classic *consume-transform-produce* loop becomes atomic.

### The consumer side is on you

For the database sink, the pattern that actually works is the **transactional outbox in reverse**: store the processed offset *in the same database transaction* as the business write.

\`\`\`sql
BEGIN;
INSERT INTO payments (...) VALUES (...);
UPDATE kafka_offsets SET committed = 42 WHERE partition = 3;
COMMIT;
\`\`\`

On restart, seek to the offset in *your* database, not Kafka's. Kafka's committed offset becomes advisory.

### The fine print

- \`isolation.level=read_committed\` or your consumers see aborted transactions
- Transactions add latency — batch accordingly
- \`transactional.id\` must be stable per producer identity, or zombie fencing cannot save you

Exactly-once is not a checkbox. It is a contract you sign across every system in the pipeline.
`,
    coverImage: 'https://picsum.photos/seed/kafka-eos/1200/630',
    tags: ['kafka', 'distributed-systems', 'data'],
    category: 'engineering',
    readingTime: 10,
    published: true,
    createdAt: '2025-09-21T16:30:00',
    updatedAt: '2025-09-21T16:30:00',
    views: 5230,
  },
]

const photoSeed = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

export const mockPhotos: Photo[] = [
  { id: 1, title: 'Old Quarter at blue hour', description: 'Hanoi wakes up before the tourists do.', url: photoSeed('hanoi-blue', 1200, 800), thumbnailUrl: photoSeed('hanoi-blue', 600, 400), category: 'travel', location: 'Hanoi, Vietnam', takenAt: '2024-02-10', width: 1200, height: 800, featured: true },
  { id: 2, title: 'Terraces above Sa Pa', description: 'Layers of green stacked into the fog.', url: photoSeed('sapa-terrace', 800, 1200), thumbnailUrl: photoSeed('sapa-terrace', 400, 600), category: 'travel', location: 'Sa Pa, Vietnam', takenAt: '2019-04-15', width: 800, height: 1200, featured: true },
  { id: 3, title: 'Golden Bridge hands', description: 'Held up by stone hands above the clouds.', url: photoSeed('danang-bridge', 1200, 800), thumbnailUrl: photoSeed('danang-bridge', 600, 400), category: 'travel', location: 'Da Nang, Vietnam', takenAt: '2019-08-03', width: 1200, height: 800, featured: false },
  { id: 4, title: 'Supertrees at night', description: 'Gardens by the Bay in full glow.', url: photoSeed('sg-supertree', 800, 1200), thumbnailUrl: photoSeed('sg-supertree', 400, 600), category: 'travel', location: 'Singapore', takenAt: '2022-11-04', width: 800, height: 1200, featured: true },
  { id: 5, title: 'Shibuya scramble', description: '3,000 people, one green light.', url: photoSeed('tokyo-shibuya', 1200, 800), thumbnailUrl: photoSeed('tokyo-shibuya', 600, 400), category: 'travel', location: 'Tokyo, Japan', takenAt: '2024-11-23', width: 1200, height: 800, featured: true },
  { id: 6, title: 'Bún chả, the original', description: 'Charcoal smoke and fish sauce. Perfection.', url: photoSeed('buncha', 1000, 1000), thumbnailUrl: photoSeed('buncha', 500, 500), category: 'food', location: 'Hanoi, Vietnam', takenAt: '2023-06-12', width: 1000, height: 1000, featured: false },
  { id: 7, title: 'Omakase in Ginza', description: 'Fourteen courses, zero regrets.', url: photoSeed('omakase', 1000, 1000), thumbnailUrl: photoSeed('omakase', 500, 500), category: 'food', location: 'Tokyo, Japan', takenAt: '2024-11-25', width: 1000, height: 1000, featured: false },
  { id: 8, title: 'Egg coffee ritual', description: 'Cà phê trứng at a hidden café upstairs.', url: photoSeed('eggcoffee', 800, 1200), thumbnailUrl: photoSeed('eggcoffee', 400, 600), category: 'food', location: 'Hanoi, Vietnam', takenAt: '2025-01-05', width: 800, height: 1200, featured: false },
  { id: 9, title: 'Battle station v4', description: 'Ultrawide, split keyboard, cable chaos hidden just out of frame.', url: photoSeed('battlestation', 1200, 800), thumbnailUrl: photoSeed('battlestation', 600, 400), category: 'code', location: 'Hanoi, Vietnam', takenAt: '2025-10-01', width: 1200, height: 800, featured: true },
  { id: 10, title: 'Deploy Friday', description: 'The team watching the progress bar. Nobody breathes.', url: photoSeed('deploy-friday', 1200, 800), thumbnailUrl: photoSeed('deploy-friday', 600, 400), category: 'code', location: 'Viettel HQ, Hanoi', takenAt: '2024-08-16', width: 1200, height: 800, featured: false },
  { id: 11, title: 'Whiteboard archaeology', description: 'Three architectures deep, still drawing boxes.', url: photoSeed('whiteboard', 1000, 1000), thumbnailUrl: photoSeed('whiteboard', 500, 500), category: 'code', location: 'Hanoi, Vietnam', takenAt: '2025-03-22', width: 1000, height: 1000, featured: false },
  { id: 12, title: 'Beach office, Canggu', description: 'Latency: bad. Vibes: immaculate.', url: photoSeed('bali-office', 1200, 800), thumbnailUrl: photoSeed('bali-office', 600, 400), category: 'life', location: 'Bali, Indonesia', takenAt: '2023-09-10', width: 1200, height: 800, featured: true },
  { id: 13, title: 'Han River blossoms', description: 'Pink snow along Yeouido.', url: photoSeed('seoul-blossom', 800, 1200), thumbnailUrl: photoSeed('seoul-blossom', 400, 600), category: 'travel', location: 'Seoul, South Korea', takenAt: '2024-04-06', width: 800, height: 1200, featured: false },
  { id: 14, title: 'Opera House from the ferry', description: 'Sails catching the winter sun.', url: photoSeed('sydney-opera', 1200, 800), thumbnailUrl: photoSeed('sydney-opera', 600, 400), category: 'travel', location: 'Sydney, Australia', takenAt: '2025-07-20', width: 1200, height: 800, featured: false },
  { id: 15, title: 'Louvre at closing time', description: 'The pyramid glows, the crowds thin.', url: photoSeed('paris-louvre', 800, 1200), thumbnailUrl: photoSeed('paris-louvre', 400, 600), category: 'travel', location: 'Paris, France', takenAt: '2026-05-31', width: 800, height: 1200, featured: true },
  { id: 16, title: 'Midnight bánh mì run', description: 'The city sleeps. The bánh mì cart does not.', url: photoSeed('banhmi-night', 1000, 1000), thumbnailUrl: photoSeed('banhmi-night', 500, 500), category: 'life', location: 'Hanoi, Vietnam', takenAt: '2026-03-14', width: 1000, height: 1000, featured: false },
]

export const mockVideos: Video[] = [
  { id: 1, title: 'Vietnam from above — drone reel 2025', description: 'Twelve months of drone footage: Hà Giang loops, Đà Nẵng coastline, Mekong sunsets.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnailUrl: photoSeed('drone-reel', 1280, 720), durationSeconds: 596, category: 'travel', createdAt: '2025-12-20T18:00:00' },
  { id: 2, title: 'Tokyo in 60 seconds', description: 'One minute, one city, eleven neighborhoods.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnailUrl: photoSeed('tokyo-60s', 1280, 720), durationSeconds: 15, category: 'travel', createdAt: '2024-12-01T12:00:00' },
  { id: 3, title: 'Building this globe — dev log #1', description: 'Screen recording + commentary: from blank canvas to spinning Earth in one weekend.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', thumbnailUrl: photoSeed('devlog-globe', 1280, 720), durationSeconds: 888, category: 'code', createdAt: '2026-04-10T09:00:00' },
  { id: 4, title: 'Street food crawl: Hanoi after dark', description: 'Seven stops, four hours, zero regrets. A guided tour of my favorite late-night eats.', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', thumbnailUrl: photoSeed('food-crawl', 1280, 720), durationSeconds: 734, category: 'food', createdAt: '2026-01-15T20:30:00' },
]

export const mockProfile: Profile = {
  name: 'Nguyễn Đình Khánh',
  alias: 'manhnpc',
  role: 'Software Engineer',
  company: 'Viettel',
  location: 'Hanoi, Vietnam',
  bio: 'I build distributed systems by day and pixel-perfect interfaces by night. This is my corner of the internet — every photo, every trip, every line of writing, owned and self-hosted.',
  skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'React', 'TypeScript', 'Three.js', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'AWS', 'CI/CD'],
  socials: {
    github: 'https://github.com/manhnpc',
    linkedin: 'https://linkedin.com/in/manhnpc',
    email: 'khanhnd75@viettel.com.vn',
  },
  stats: {
    yearsOfExperience: 5,
    projectsCompleted: 20,
    countriesVisited: 9,
    cupsOfCoffee: 9999,
  },
}
