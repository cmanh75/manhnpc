# VPS debugging cheatsheet

SSH into the VPS, then:

```bash
cd /opt/manhnpc/backend
```

All commands below assume that working directory.

## 1. Container status

```bash
docker compose -f docker-compose.prod.yml ps
```

Look at the `STATUS` column — `Restarting` or repeatedly-recent `Up` means a container is crash-looping.

## 2. System resources

```bash
free -h
df -h /
```

Common root cause of restart loops: RAM or disk exhaustion (all 8 services + gateway + discovery on one box).

## 3. Per-container resource usage

```bash
docker stats --no-stream
```

## 4. Logs — everything, last 50 lines

```bash
docker compose -f docker-compose.prod.yml logs --tail 50 --timestamps
```

## 5. Logs — one service

```bash
docker compose -f docker-compose.prod.yml logs <service-name> --tail 150
```

Service names: `discovery-server`, `auth-service`, `content-service`, `media-service`, `travel-service`, `guestbook-service`, `journal-service`, `api-gateway`.

Search for `Exception`, `Error`, `Caused by:`, or `OutOfMemory` in the output.

## 6. Restart count per container

```bash
docker inspect --format='{{.Name}}: RestartCount={{.RestartCount}}' $(docker compose -f docker-compose.prod.yml ps -q)
```

A number that's `>0` and climbing means active crash-looping.

## 7. What's actually registered in Eureka

```bash
curl -s http://localhost:8761/eureka/apps | grep -oE '<name>[A-Z-]+</name>' | sort -u
```

If a service is missing from this list, the gateway will 503 on its routes even though the container shows `Up` — it just hasn't (or can't) finish registering.

## Quick triage flow

1. Run **#1**. Anything not `Up`? → run **#5** for that service, look for the exception at the bottom.
2. Everything `Up` but a route still 502/503? → run **#7** to confirm it's actually registered, and **#6** to rule out a silent crash-restart cycle.
3. Multiple services flapping at once? → run **#2**/**#3** first — usually memory pressure.
