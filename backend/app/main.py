"""
Main FastAPI application module.
Handles server initialization, middleware, routing, and configuration.
"""
import os
import time
import json
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .api.routes import router


# ============ Configuration ============
def get_environment() -> str:
    """Get current environment (development or production)."""
    return os.getenv("NODE_ENV", "development")


def is_development() -> bool:
    """Check if running in development mode."""
    return get_environment() == "development"


def is_production() -> bool:
    """Check if running in production mode."""
    return get_environment() == "production"


# ============ Logging Middleware ============
class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging requests and responses.
    Matches the format of the TypeScript Express server.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip logging for non-API routes in production
        if is_production() and not request.url.path.startswith("/api"):
            return await call_next(request)
        
        # Start timing
        start_time = time.time()
        
        # Store original response body for logging
        response_body = None
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = int((time.time() - start_time) * 1000)  # Convert to milliseconds
        
        # Log API requests only
        if request.url.path.startswith("/api"):
            # Try to capture response body for logging (only for JSON responses)
            if hasattr(response, "body"):
                try:
                    # For streaming responses, we need to collect the body
                    if hasattr(response, "body_iterator"):
                        body_chunks = []
                        async for chunk in response.body_iterator:
                            body_chunks.append(chunk)
                        response_body = b"".join(body_chunks)
                        # Create new response with the collected body
                        response = Response(
                            content=response_body,
                            status_code=response.status_code,
                            headers=dict(response.headers),
                            media_type=response.media_type
                        )
                        
                        # Try to parse as JSON for logging
                        if response.media_type == "application/json":
                            try:
                                response_json = json.loads(response_body)
                                response_body = json.dumps(response_json)
                            except:
                                response_body = None
                except Exception:
                    response_body = None
            
            # Format log message
            log_message = f"{request.method} {request.url.path} {response.status_code} in {duration}ms"
            
            # Add response body if available
            if response_body:
                log_message += f" :: {response_body}"
                # Truncate if too long
                if len(log_message) > 80:
                    log_message = log_message[:79] + "…"
            
            # Log to console (matching Express format with timestamp)
            import datetime
            timestamp = datetime.datetime.now().strftime("%I:%M:%S %p")
            print(f"{timestamp} [fastapi] {log_message}")
        
        return response


# ============ Error Handlers ============
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with consistent format.
    Returns {"message": str, "errors": list} format.
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])  # Skip 'body' prefix
        errors.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=422,
        content={
            "message": "Validation error",
            "errors": errors
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions with consistent format.
    Returns {"message": str, "errors": list} format.
    """
    # Extract error details
    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", str(exc.detail))
        errors = exc.detail.get("errors", [])
    elif isinstance(exc.detail, list):
        message = "Request failed"
        errors = exc.detail
    else:
        message = str(exc.detail)
        errors = []
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": message,
            "errors": errors if isinstance(errors, list) else [str(errors)]
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle general exceptions with consistent format.
    Returns {"message": str, "errors": list} format.
    """
    # Log the error for debugging
    print(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal Server Error",
            "errors": [str(exc)] if is_development() else ["An unexpected error occurred"]
        }
    )


# ============ Lifespan Events ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application lifespan events.
    Startup and shutdown logic goes here.
    """
    # Startup
    env = get_environment()
    port = int(os.getenv("PORT", "8000"))
    print(f"Starting FastAPI server in {env} mode on port {port}")
    
    yield
    
    # Shutdown
    print("Shutting down FastAPI server")


# ============ FastAPI Application ============
# Create FastAPI app
app = FastAPI(
    title="Salary Calculator API",
    description="Vietnamese salary calculation API with tax computation",
    version="1.0.0",
    lifespan=lifespan,
    # Disable automatic docs in production
    docs_url="/docs" if is_development() else None,
    redoc_url="/redoc" if is_development() else None,
    openapi_url="/openapi.json" if is_development() else None,
)


# ============ Middleware Configuration ============

# Add CORS middleware
if is_development():
    # Development CORS settings - allow all origins in development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Production CORS settings - more restrictive
    # TODO: Replace with your actual production domain(s)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://your-domain.com",
            "https://www.your-domain.com"
        ],  # Configure based on your production domain
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )

# Add logging middleware
app.add_middleware(LoggingMiddleware)


# ============ Exception Handlers ============
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)


# ============ Health Check Endpoint ============
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns server status and environment info.
    """
    return {
        "status": "healthy",
        "environment": get_environment(),
        "timestamp": time.time(),
        "service": "salary-calculator-api"
    }


# ============ Include API Routes ============
# Mount API routes with /api prefix
app.include_router(router)


# ============ Static File Serving ============
# In development, Vite serves the frontend
# In production, FastAPI serves the built files
if is_production():
    # Path to the built frontend files
    static_dir = Path("dist/public")
    
    # Check if static directory exists
    if static_dir.exists() and static_dir.is_dir():
        # Mount static files
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
        
        # Serve index.html for all non-API routes (SPA support)
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            """
            Serve the SPA index.html for all non-API routes.
            This enables client-side routing.
            """
            # Skip API routes
            if full_path.startswith("api/"):
                raise HTTPException(status_code=404, detail="API endpoint not found")
            
            # Serve index.html
            index_file = static_dir / "index.html"
            if index_file.exists():
                return FileResponse(index_file)
            else:
                raise HTTPException(status_code=404, detail="Application not found")
    else:
        print(f"Warning: Static directory {static_dir} not found. Static file serving disabled.")
else:
    # In development, serve the frontend via proxy to Vite
    # This allows hot module replacement while keeping single port access
    import httpx
    
    @app.get("/{full_path:path}")
    async def proxy_to_vite(full_path: str, request: Request):
        """
        Proxy non-API requests to Vite dev server in development.
        """
        # Skip API routes and health check
        if full_path.startswith("api/") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not found")
        
        # Proxy to Vite dev server
        vite_url = f"http://localhost:12000/{full_path}"
        
        try:
            async with httpx.AsyncClient() as client:
                # Forward the request
                vite_response = await client.get(
                    vite_url,
                    headers={k: v for k, v in request.headers.items() if k.lower() not in ['host', 'connection']},
                    follow_redirects=True
                )
                
                # Return the response
                return Response(
                    content=vite_response.content,
                    status_code=vite_response.status_code,
                    headers={k: v for k, v in vite_response.headers.items() if k.lower() not in ['content-encoding', 'transfer-encoding']},
                    media_type=vite_response.headers.get('content-type', 'text/html')
                )
        except httpx.ConnectError:
            # If Vite is not running, serve a simple message
            return Response(
                content="<h1>Frontend server is not running</h1><p>Please ensure Vite dev server is running on port 12000</p>",
                status_code=503,
                media_type="text/html"
            )


# ============ Main Entry Point ============
if __name__ == "__main__":
    """
    Run the FastAPI application using uvicorn.
    This is the main entry point when running the script directly.
    """
    import uvicorn
    
    # Get configuration from environment
    port = int(os.getenv("PORT", "8000"))
    host = "0.0.0.0"
    reload = False  # Disabled as watchfiles not installed
    
    # Configure uvicorn
    log_level = "debug" if is_development() else "info"
    
    # Print startup message
    print(f"Starting FastAPI server...")
    print(f"Environment: {get_environment()}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Auto-reload: {reload}")
    
    if is_development():
        print(f"API Documentation: http://localhost:{port}/docs")
        print(f"Alternative docs: http://localhost:{port}/redoc")
    
    # Run the server
    uvicorn.run(
        "backend.app.main:app",  # Module path to the app
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
        # Additional development settings
        reload_dirs=["backend"] if reload else None,
        # Use colors in terminal output
        use_colors=True,
        # Access log format similar to Express
        access_log=True,
    )