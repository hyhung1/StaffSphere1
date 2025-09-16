@echo off
echo ========================================
echo    Employee Management Dashboard
echo        Development Mode
echo ========================================
echo Starting both frontend and backend servers...
echo.

REM Start backend server in background
echo Starting backend server on port 3200...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && set PORT=3200 && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo Starting frontend development server on port 2120...
cd /d "%~dp0frontend"
echo.
echo Backend: http://localhost:3200
echo Frontend: http://localhost:2120
echo.
echo Press Ctrl+C to stop the frontend server
echo (Close the Backend Server window separately)
echo ========================================
set PORT=2120
call npm start

pause