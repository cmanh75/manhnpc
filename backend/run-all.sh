#!/usr/bin/env bash
# Starts the manhnpc backend monolith from the built jar.
# Build first:  mvn -q -DskipTests package
# Stop later with:  pkill -f manhnpc-backend or kill the PID printed below.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION="1.0.0"
JAR="$ROOT/target/manhnpc-backend-$VERSION.jar"

if [ ! -f "$JAR" ]; then
  echo "Jar not found: $JAR -- run 'mvn -q -DskipTests package' first." >&2
  exit 1
fi

echo "Starting manhnpc-backend ..."
(cd "$ROOT" && java -jar "$JAR" > "$ROOT/manhnpc-backend.log" 2>&1 &)

echo
echo "Backend launched (log: manhnpc-backend.log)."
echo "  API : http://localhost:8090"
echo "  Try : curl http://localhost:8090/api/profile"

# ------------------------------------------------------------------
# Alternative: run from sources with the Spring Boot Maven plugin
#
#   mvn spring-boot:run
# ------------------------------------------------------------------
