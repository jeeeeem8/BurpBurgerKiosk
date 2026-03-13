@echo off
echo ================================
echo Burp Burger - Diagnostics
echo ================================
echo.

echo [1] Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [-] Node.js NOT found
) else (
    echo [+] Node.js: 
    node --version
)
echo.

echo [2] Checking MongoDB...
mongod --version > nul 2>&1
if %errorlevel% neq 0 (
    echo [-] MongoDB command NOT found
) else (
    echo [+] MongoDB: 
    mongod --version
)
echo.

echo [3] Checking MongoDB service...
netstat -ano | findstr :27017 > nul
if %errorlevel% neq 0 (
    echo [-] MongoDB is NOT running (port 27017 not in use)
    echo.
    echo To start MongoDB:
    echo   Option 1: mongod
    echo   Option 2: net start MongoDB
) else (
    echo [+] MongoDB is running on port 27017
)
echo.

echo [4] Checking backend dependencies...
cd /d "%~dp0backend"
if exist "node_modules" (
    echo [+] node_modules directory exists
) else (
    echo [-] node_modules NOT found
    echo    Run: npm install
)
echo.

echo [5] Backend package.json...
if exist "package.json" (
    echo [+] package.json found
    echo    Key dependencies:
    findstr "mongoose express multer" package.json
) else (
    echo [-] package.json NOT found
)
echo.

echo [6] MongoDB connection test...
echo Attempting to connect to: mongodb://127.0.0.1:27017/kiosk_ordering_db
echo.

node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://127.0.0.1:27017/kiosk_ordering_db').then(() => { console.log('[+] MongoDB connection successful'); process.exit(0); }).catch(e => { console.log('[-] Connection failed:', e.message); process.exit(1); });"

if %errorlevel% neq 0 (
    echo.
    echo [!] MongoDB connection failed
    echo Solutions:
    echo   1. Start MongoDB: mongod
    echo   2. Check if port 27017 is in use by another process
    echo   3. Check MongoDB logs for errors
) else (
    echo.
    echo [+] All checks passed!
    echo You can now start the backend.
)
echo.

pause
