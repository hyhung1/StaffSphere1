#!/usr/bin/env python
"""
Simple script to run the FastAPI server.
Usage: python backend/run.py
"""
import os
import sys
import uvicorn

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app, is_development

if __name__ == "__main__":
    # Get configuration from environment
    port = int(os.getenv("PORT", "3200"))
    host = "0.0.0.0"
    reload = False  # Disabled as watchfiles not installed
    
    # Configure uvicorn
    log_level = "debug" if is_development() else "info"
    
    # Print startup message
    print(f"Starting FastAPI server...")
    print(f"Environment: {os.getenv('NODE_ENV', 'development')}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Auto-reload: {reload}")
    
    if is_development():
        print(f"API Documentation: http://localhost:{port}/docs")
        print(f"Alternative docs: http://localhost:{port}/redoc")
    
    # Run the server
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
        # Use colors in terminal output
        use_colors=True,
        # Access log format
        access_log=True,
    )