# Скрипт для перезапуска backend после миграции

Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Cleaning Prisma cache..." -ForegroundColor Yellow
Remove-Item -Path "backend\node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
Set-Location backend
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "Prisma Client generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "Error generating Prisma Client" -ForegroundColor Red
}

Set-Location ..
