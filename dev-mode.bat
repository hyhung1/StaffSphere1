@echo off
echo ========================================
echo    Employee Management Dashboard
echo        Development Mode
echo ========================================
echo Starting both frontend and backend servers...
echo.

REM Start backend server in background
echo Starting backend server on port 8000...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo Starting frontend development server on port 3000...
cd /d "%~dp0frontend"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop the frontend server
echo (Close the Backend Server window separately)
echo ========================================
call npm start

pause