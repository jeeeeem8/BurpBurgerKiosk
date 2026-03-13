@echo off
echo ================================
echo  Burp Burger Kiosk - Startup
echo ================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo.
    echo [!] MongoDB is NOT running
    echo.
    echo Starting MongoDB...
    REM Try to start MongoDB service
    net start MongoDB > nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo [Error] Could not start MongoDB service
        echo.
        echo Try one of these:
        echo 1. Start MongoDB manually: mongod
        echo 2. Check if mongod.exe is in your PATH
        echo 3. Install MongoDB if not already installed
        echo.
        pause
        exit /b 1
    )
    echo [+] MongoDB started
) else (
    echo [+] MongoDB is running on port 27017
)

echo.
echo Starting backend server...
echo.

cd /d "%~dp0backend"
node server.js

pause
