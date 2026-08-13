# Starts the manhnpc backend monolith from the built jar.
# Build first:  mvn -q -DskipTests package
# Stop later with:  Get-Process java | Stop-Process   (or close the spawned window)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$version = "1.0.0"

$jar = Join-Path $root "target\manhnpc-backend-$version.jar"
if (-not (Test-Path $jar)) {
    Write-Error "Jar not found: $jar  -- run 'mvn -q -DskipTests package' first."
}

Write-Host "Starting manhnpc-backend ..." -ForegroundColor Cyan
Start-Process java -ArgumentList "-jar", "`"$jar`"" -WorkingDirectory $root

Write-Host ""
Write-Host "Backend launched." -ForegroundColor Green
Write-Host "  API : http://localhost:8090"
Write-Host "  Try : curl http://localhost:8090/api/profile"
