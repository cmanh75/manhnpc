# start-all.ps1 — boots the entire manhnpc universe with one command.
# Order: backend monolith -> Vite dev server.
# Note: backend runs on 8090 (8080 is taken by Apache/XAMPP on this machine).

$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

Write-Host '=== manhnpc universe: igniting ===' -ForegroundColor Magenta

$jar = Join-Path $backend 'target\manhnpc-backend-1.0.0.jar'
if (-not (Test-Path $jar)) {
    Write-Host "[skip] backend jar not found - run 'mvn -DskipTests package' in backend\ first" -ForegroundColor Yellow
} else {
    Write-Host '[boot] backend' -ForegroundColor Cyan
    Start-Process -WindowStyle Minimized java -ArgumentList '-Xmx512m', '-XX:MaxMetaspaceSize=200m', '-jar', $jar -WorkingDirectory $backend
    Start-Sleep -Seconds 8
}

Write-Host '[boot] frontend (Vite)' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$frontend'; npm run dev"

Start-Sleep -Seconds 6
Start-Process 'http://localhost:5173'

Write-Host ''
Write-Host '=== all systems go ===' -ForegroundColor Green
Write-Host '  frontend   http://localhost:5173'
Write-Host '  backend    http://localhost:8090'
