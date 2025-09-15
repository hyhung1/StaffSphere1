@echo off
echo ========================================
echo    Employee Management Dashboard
echo ========================================
echo Starting the application...
echo.

REM Change to backend directory and start the server
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