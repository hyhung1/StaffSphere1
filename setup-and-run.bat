@echo off
echo ========================================
echo    Employee Management Dashboard
echo         Setup and Run
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd /d "%~dp0backend"
pip install fastapi uvicorn pandas openpyxl python-multipart pydantic
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Building frontend for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo Starting the application...
echo ========================================
echo.

REM Start the server
cd /d "%~dp0backend"
echo Starting FastAPI server on http://localhost:8000
echo.
echo The application will serve both:
echo - Backend API endpoints  
echo - Frontend React application
echo.
echo Press Ctrl+C to stop the server
echo ========================================
python main.py

pause