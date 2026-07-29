#!/usr/bin/env bash
# Starts all manhnpc backend services from the built jars, in the right order.
# Build first:  mvn -q -DskipTests package
# Stop later with:  pkill -f 'manhnpc|discovery-server|api-gateway' or kill the PIDs printed below.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION="1.0.0"

start_service() {
  local module="$1"
  local jar="$ROOT/$module/target/$module-$VERSION.jar"
  if [ ! -f "$jar" ]; then
    echo "Jar not found: $jar -- run 'mvn -q -DskipTests package' first." >&2
    exit 1
  fi
  echo "Starting $module ..."
  (cd "$ROOT" && java -jar "$jar" > "$ROOT/$module.log" 2>&1 &)
}

# 1) Service registry first
start_service discovery-server
echo "Waiting 15s for Eureka to come up on :8761 ..."
sleep 15

# 2) Business services
start_service auth-service
sleep 3
start_service content-service
sleep 3
start_service media-service
sleep 3
start_service travel-service
start_service guestbook-service
sleep 10

# 3) Gateway last
start_service api-gateway

echo
echo "All services launched (logs: <module>.log)."
echo "  Eureka dashboard : http://localhost:8761"
echo "  API gateway      : http://localhost:8090"
echo "  Try              : curl http://localhost:8090/api/profile"

# ------------------------------------------------------------------
# Alternative: run from sources with the Spring Boot Maven plugin
# (one terminal per service, same order):
#
#   mvn -pl discovery-server spring-boot:run
#   mvn -pl auth-service     spring-boot:run
#   mvn -pl content-service  spring-boot:run
#   mvn -pl media-service    spring-boot:run
#   mvn -pl travel-service   spring-boot:run
#   mvn -pl api-gateway      spring-boot:run
# ------------------------------------------------------------------
