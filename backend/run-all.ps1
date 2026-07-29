# Starts all manhnpc backend services from the built jars, in the right order.
# Build first:  mvn -q -DskipTests package
# Stop later with:  Get-Process java | Stop-Process   (or close the spawned windows)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$version = "1.0.0"

function Start-Service([string]$module) {
    $jar = Join-Path $root "$module\target\$module-$version.jar"
    if (-not (Test-Path $jar)) {
        Write-Error "Jar not found: $jar  -- run 'mvn -q -DskipTests package' first."
    }
    Write-Host "Starting $module ..." -ForegroundColor Cyan
    Start-Process java -ArgumentList "-jar", "`"$jar`"" -WorkingDirectory $root
}

# 1) Service registry first
Start-Service "discovery-server"
Write-Host "Waiting 15s for Eureka to come up on :8761 ..."
Start-Sleep -Seconds 15

# 2) Business services
Start-Service "auth-service"
Start-Sleep -Seconds 3
Start-Service "content-service"
Start-Sleep -Seconds 3
Start-Service "media-service"
Start-Sleep -Seconds 3
Start-Service "travel-service"
Start-Service "guestbook-service"
Start-Sleep -Seconds 10

# 3) Gateway last
Start-Service "api-gateway"

Write-Host ""
Write-Host "All services launched." -ForegroundColor Green
Write-Host "  Eureka dashboard : http://localhost:8761"
Write-Host "  API gateway      : http://localhost:8090"
Write-Host "  Try              : curl http://localhost:8090/api/profile"
