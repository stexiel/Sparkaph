@echo off
echo ========================================
echo   Sparkaph - Quick Start
echo ========================================
echo.

echo [1/3] Starting Go server...
cd server
start "Sparkaph Server" cmd /k "set SERVER_PORT=8081 && bin\gameserver.exe"
timeout /t 2 /nobreak >nul

echo [2/3] Server started on http://localhost:8081
echo.
echo [3/3] Open Unity and press Play!
echo.
echo ========================================
echo   Server is running!
echo ========================================
echo.
echo Server URL: ws://localhost:8081/ws
echo Health: http://localhost:8081/health
echo Metrics: http://localhost:8081/metrics
echo.
echo Press any key to stop server...
pause >nul

taskkill /FI "WINDOWTITLE eq Sparkaph Server*" /T /F
echo Server stopped.
