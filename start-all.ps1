# start-all.ps1 — boots the entire manhnpc universe with one command.
# Order: Eureka -> 4 domain services -> API gateway -> Vite dev server.
# Note: gateway runs on 8090 (8080 is taken by Apache/XAMPP on this machine).

$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function Start-Jar($module) {
    $jar = Join-Path $backend "$module\target\$module-1.0.0.jar"
    if (-not (Test-Path $jar)) {
        Write-Host "[skip] $module jar not found - run 'mvn -DskipTests package' in backend\ first" -ForegroundColor Yellow
        return
    }
    Write-Host "[boot] $module" -ForegroundColor Cyan
    # heap caps keep the 8-JVM fleet under ~1.5GB total commit
    Start-Process -WindowStyle Minimized java -ArgumentList '-Xmx256m', '-XX:MaxMetaspaceSize=160m', '-Xss512k', '-jar', $jar -WorkingDirectory $backend
}

Write-Host '=== manhnpc universe: igniting ===' -ForegroundColor Magenta

Start-Jar 'discovery-server'
Start-Sleep -Seconds 12

'auth-service', 'content-service', 'media-service', 'travel-service', 'guestbook-service', 'journal-service', 'audit-service' | ForEach-Object { Start-Jar $_ }
Start-Sleep -Seconds 20

Start-Jar 'api-gateway'

Write-Host '[boot] frontend (Vite)' -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$frontend'; npm run dev"

Start-Sleep -Seconds 6
Start-Process 'http://localhost:5173'

Write-Host ''
Write-Host '=== all systems go ===' -ForegroundColor Green
Write-Host '  frontend   http://localhost:5173'
Write-Host '  gateway    http://localhost:8090'
Write-Host '  eureka     http://localhost:8761'
Write-Host '  (gateway needs ~30s after boot for Eureka route sync)'
