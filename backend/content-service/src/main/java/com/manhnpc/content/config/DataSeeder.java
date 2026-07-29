package com.manhnpc.content.config;

import com.manhnpc.content.model.Post;
import com.manhnpc.content.repository.PostRepository;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedPosts(PostRepository posts) {
        return args -> {
            if (posts.count() > 0) {
                return;
            }

            posts.save(post(
                    "Designing Resilient Microservices with Spring Cloud",
                    "designing-resilient-microservices-with-spring-cloud",
                    "Circuit breakers, retries, timeouts and bulkheads: the four horsemen of not getting paged at 3 AM. A field guide from production.",
                    """
                    # Designing Resilient Microservices with Spring Cloud

                    The first time one of my services took down three others, I learned an expensive lesson: in a distributed system, failure is not an edge case. It is the default operating condition. The network will partition, a downstream dependency will hang, and a pod will be OOM-killed at the worst possible moment. Resilience is not something you sprinkle on at the end — it has to be designed in from day one.

                    ## Start with timeouts, always

                    The single most common mistake I see in microservice codebases is the missing timeout. A REST call without a timeout is a promise to wait forever, and thread pools fill up fast when every request is waiting on a dependency that stopped answering. My rule: every remote call gets a connect timeout and a read timeout, and the read timeout must be shorter than the caller's own SLA. If your endpoint promises 2 seconds, you cannot wait 5 seconds on a downstream service.

                    ## Circuit breakers stop the bleeding

                    Once timeouts are in place, add circuit breakers with Resilience4j. The idea is simple: when a dependency fails repeatedly, stop calling it for a while and fail fast instead. This does two things — it gives the struggling service room to recover, and it keeps your own latency predictable. Configure the sliding window based on real traffic, not defaults. A window of 10 calls is meaningless at 500 RPS.

                    ## Bulkheads and backpressure

                    Isolate thread pools per dependency so one slow neighbor cannot starve everyone else. In the reactive world this becomes backpressure: consume only what you can process. Spring Cloud Gateway handles this beautifully at the edge, but internal services need the same discipline.

                    ## Retries are dangerous

                    Retries amplify load precisely when the system is weakest. Retry only idempotent operations, cap attempts at two or three, and always add jitter. A synchronized retry storm from a hundred instances is indistinguishable from a DDoS attack — I know because I have caused one.

                    ## The payoff

                    None of this is glamorous work. But when a dependency died last month and our dashboard showed a clean fast-fail with fallbacks instead of a cascading outage, nobody got paged. That silence is what good architecture sounds like.
                    """,
                    "spring,microservices,resilience,java",
                    "engineering", 8, LocalDateTime.of(2026, 5, 14, 9, 30)));

            posts.save(post(
                    "My Journey from Monolith to Microservices at Viettel",
                    "my-journey-from-monolith-to-microservices-at-viettel",
                    "Splitting a five-year-old monolith into services without stopping the business: what worked, what hurt, and what I would do differently.",
                    """
                    # My Journey from Monolith to Microservices at Viettel

                    When I joined the team, the system was a single deployable that had grown for five years. Every release was a two-hour ceremony involving four teams, a war-room chat, and a rollback plan that everyone hoped nobody would need. The codebase was not bad — it was simply too big for the organization built around it. This is the part nobody tells you: you migrate to microservices because of people, not technology.

                    ## Step one: draw the seams before you cut

                    We spent a full month doing nothing but domain mapping. Billing, subscriber management, notifications, reporting — the bounded contexts were obvious on the whiteboard but tangled in the code. We used the strangler fig pattern: new capabilities were built as services from the start, while existing modules were extracted one at a time behind an API gateway that routed traffic transparently.

                    ## The database is the real monolith

                    Splitting code is easy. Splitting data is where migrations go to die. Our shared Oracle schema had foreign keys crossing every domain boundary. We introduced service-owned schemas gradually, using change-data-capture to keep the old tables in sync during transition. For months, both worlds ran in parallel, and reconciliation jobs were our safety net. Boring? Absolutely. But boring is what keeps subscriber billing correct.

                    ## What hurt

                    Distributed transactions hurt. We replaced them with sagas and learned to design for eventual consistency. Debugging hurt too, until we invested in centralized logging and distributed tracing — do this on day one, not month six. And the operational load of thirty services with a team sized for one monolith nearly broke us before we automated deployments properly.

                    ## What I would do differently

                    I would extract fewer, larger services first. We over-split early, then spent a year merging nano-services back together. The right service size is the one a single team can own end to end. Microservices are an organizational refactoring with technical side effects — get the team boundaries right and the architecture follows.
                    """,
                    "microservices,architecture,career,viettel",
                    "engineering", 9, LocalDateTime.of(2026, 3, 2, 20, 15)));

            posts.save(post(
                    "Three.js Tricks for Buttery 60fps Globes",
                    "threejs-tricks-for-buttery-60fps-globes",
                    "How I made the travel globe on this site spin at a rock-solid 60fps: instancing, texture tricks, and knowing what not to render.",
                    """
                    # Three.js Tricks for Buttery 60fps Globes

                    The travel page on this site renders an interactive 3D globe with a dot for every place I have visited. The first version ran at 22fps on my laptop and turned my phone into a hand warmer. Getting it to a locked 60fps taught me more about GPU behavior than any tutorial ever did.

                    ## Draw calls are the enemy

                    My naive version created one mesh per location marker — a few dozen draw calls just for dots, plus the atmosphere, the globe, and the arcs between cities. The fix is InstancedMesh: one geometry, one material, one draw call, with per-instance transforms in a buffer attribute. Marker count stopped mattering entirely. If you render repeated objects without instancing, you are leaving most of your frame budget on the table.

                    ## Fake the expensive stuff

                    The atmospheric glow that everyone loves is not volumetric anything — it is a slightly larger sphere with a fresnel shader rendered on the back side. The city lights on the night side are a single emissive texture, not point lights. Real lighting is for games with a rendering team; a portfolio globe needs cheap tricks that look expensive.

                    ## Only render when something changes

                    A spinning globe does not need requestAnimationFrame at full speed when the tab is hidden or the user has scrolled past it. I pause the loop with IntersectionObserver and drop to a lower pixel ratio on battery power. Also: set powerPreference to high-performance, cap devicePixelRatio at 2, and never resize the canvas in a scroll handler.

                    ## Geometry hygiene

                    Merge static geometry once at load. Reuse materials aggressively — every unique material is a state change. Convert the great-circle arcs to a single BufferGeometry with all curves concatenated, drawn as line segments in one call.

                    ## The result

                    Steady 60fps on a mid-range phone with 4x less memory. The GPU does not reward cleverness; it rewards doing dramatically less work. Profile first with the browser's performance panel, and let the flame chart tell you where the frame actually goes.
                    """,
                    "threejs,webgl,frontend,performance",
                    "frontend", 7, LocalDateTime.of(2026, 1, 18, 14, 0)));

            posts.save(post(
                    "JWT Security Pitfalls I Keep Seeing in Code Reviews",
                    "jwt-security-pitfalls",
                    "The algorithm-confusion attack, tokens that never die, secrets in git history — a checklist of JWT mistakes and how to avoid them.",
                    """
                    # JWT Security Pitfalls I Keep Seeing in Code Reviews

                    JSON Web Tokens are deceptively simple: three base64 blobs and a signature. That simplicity is exactly why the same mistakes appear in codebase after codebase. Here is my running list from years of code reviews, including mistakes I have made myself.

                    ## Pitfall 1: trusting the header's algorithm

                    The classic attack: an attacker changes the header to alg=none, or swaps RS256 for HS256 so your RSA public key gets used as an HMAC secret. The fix is to never let the token tell you how to verify it. Pin the algorithm on the server side. Modern libraries like JJWT 0.12 force you to specify the verification key type explicitly, which kills this entire class of bugs — one good reason to keep dependencies current.

                    ## Pitfall 2: weak or leaked secrets

                    An HS256 secret that is a dictionary word can be brute-forced offline from a single captured token with hashcat. Use at least 256 bits of real randomness. And never commit secrets — I once found a production signing key in a repository's git history, three years after it was supposedly removed. Rotate keys when people leave the team.

                    ## Pitfall 3: tokens that live forever

                    A JWT with no expiry is a permanent credential. Keep access tokens short-lived — minutes to hours, not days — and pair them with refresh tokens you can revoke server-side. Remember that logout does nothing to an already-issued stateless token; if that matters for your threat model, you need a denylist or short expiry.

                    ## Pitfall 4: putting secrets in the payload

                    The payload is base64-encoded, not encrypted. Anyone with the token can read every claim in it. Usernames and roles are fine; anything sensitive is not.

                    ## Pitfall 5: validating only the signature

                    A valid signature is necessary, not sufficient. Check expiry, issuer, and audience. Skipping audience checks lets a token minted for one service be replayed against another.

                    JWTs are a fine tool with sharp edges. Treat the RFC as a starting point, pin everything pinnable, and assume every token will eventually be captured by someone curious.
                    """,
                    "security,jwt,java,backend",
                    "security", 8, LocalDateTime.of(2025, 11, 9, 10, 45)));

            posts.save(post(
                    "Why I Built My Own Digital Garden",
                    "why-i-built-my-own-digital-garden",
                    "Social media posts vanish into the feed. A personal site compounds. On owning your corner of the internet — and over-engineering it for fun.",
                    """
                    # Why I Built My Own Digital Garden

                    Every developer eventually faces the question: why maintain a personal site in the age of social platforms? I have written threads that disappeared into the feed within hours and answers on forums I can no longer even find. The half-life of content on someone else's platform is measured in days. Meanwhile, a blog post I wrote years ago still gets emails from strangers who found it useful. That asymmetry is the whole argument.

                    ## A garden, not a feed

                    A feed is chronological and disposable; a garden is spatial and cultivated. Notes here get revisited, pruned, and linked together. Some posts are polished essays, others are half-grown notes I update as I learn. Removing the pressure for everything to be finished is what makes writing sustainable. The travel map, the photo wall, the blog — they are one connected archive of a life, not a content strategy.

                    ## Yes, it is over-engineered — that is the point

                    This site runs on six Spring Boot microservices behind a gateway with service discovery, for what is essentially a blog with pictures. Do I need Eureka for this? Absolutely not. But my personal site is the one codebase where nobody reviews my architectural decisions, and that freedom has real value. It is where I tried virtual threads before proposing them at work, where I learned Three.js, where breaking production affects an audience of exactly one.

                    ## Owning the stack teaches the stack

                    When you own everything from DNS to database, there is no ticket to file and nobody else to blame. Certificate renewal, backup strategy, CORS headaches, image optimization — every annoyance is a lesson that transfers directly to my day job. Platform knowledge compounds just like published writing does.

                    ## Plant your own

                    Start smaller than I did — a single static page is a fine seed. Write the post you needed six months ago. Feeds are rented ground, and the rent keeps going up. Gardens are owned, and they appreciate. Ten years from now, this archive will still be here, still mine, still growing.
                    """,
                    "meta,writing,career,digital-garden",
                    "life", 6, LocalDateTime.of(2025, 9, 21, 22, 30)));

            posts.save(post(
                    "Kafka Exactly-Once Semantics in Practice",
                    "kafka-exactly-once-semantics-in-practice",
                    "Exactly-once is real, but it is not magic. Idempotent producers, transactions, and the sharp edges we hit running EOS in production.",
                    """
                    # Kafka Exactly-Once Semantics in Practice

                    "Exactly-once delivery is impossible" is a favorite distributed-systems one-liner, and it is true — for delivery. What Kafka actually offers is exactly-once processing semantics within its ecosystem, which is a different and far more useful promise. We run it in production for a billing pipeline where duplicates mean charging customers twice. Here is what the documentation says, and what it feels like at 2 AM.

                    ## The three building blocks

                    First, idempotent producers: with enable.idempotence=true, the broker deduplicates producer retries using sequence numbers, eliminating duplicates from network hiccups. This is nearly free and should be your default everywhere.

                    Second, transactions: a producer with a transactional.id can write to multiple partitions atomically, and either everything commits or nothing does. Crucially, consumer offsets are committed inside the same transaction — this consume-transform-produce loop is the heart of EOS.

                    Third, reading committed data: downstream consumers must set isolation.level=read_committed, or they will happily read aborted transactional writes and undo everything you built.

                    ## The sharp edges

                    Transactional IDs must be stable across restarts and unique per producer instance, which interacts badly with autoscaling — we pin IDs to partition assignments instead of pod names. Transactions add latency: commit intervals become your minimum end-to-end delay, so tune transaction.timeout.ms and expect throughput to drop noticeably compared to at-least-once.

                    The biggest gotcha: exactly-once ends at Kafka's boundary. The moment your consumer writes to Postgres or calls a REST API, you are back in at-least-once land and need idempotency keys or upserts on the sink side. Kafka Streams handles the internal plumbing for you with processing.guarantee=exactly_once_v2, which is dramatically simpler than hand-rolling the transaction dance.

                    ## Verdict

                    EOS is not a checkbox; it is a contract you must hold end to end. For our billing flow the complexity pays for itself daily. For clickstream analytics, at-least-once with idempotent sinks would be simpler and faster. Know which problem you actually have before you sign the contract.
                    """,
                    "kafka,distributed-systems,backend,java",
                    "engineering", 10, LocalDateTime.of(2025, 7, 5, 8, 0)));
        };
    }

    private static Post post(String title, String slug, String excerpt, String content,
                             String tags, String category, int readingTime, LocalDateTime createdAt) {
        return Post.builder()
                .title(title)
                .slug(slug)
                .excerpt(excerpt)
                .content(content.strip())
                .coverImage("https://picsum.photos/seed/" + slug + "/1200/630")
                .tags(tags)
                .category(category)
                .readingTime(readingTime)
                .published(true)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .views((long) (Math.abs(slug.hashCode()) % 900) + 100)
                .build();
    }
}
