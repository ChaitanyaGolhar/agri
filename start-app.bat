@echo off
echo Starting AgriBusiness Manager...
echo.

echo Checking if MongoDB is running...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB is not running. Please start MongoDB first.
    echo.
    echo To start MongoDB:
    echo 1. Open Command Prompt as Administrator
    echo 2. Run: net start MongoDB
    echo    OR
    echo 3. Run: mongod --dbpath C:\data\db
    echo.
    echo For detailed instructions, see start-mongodb.md
    pause
    exit /b 1
)

echo MongoDB is running!
echo Starting the application...
echo.

npm run dev
