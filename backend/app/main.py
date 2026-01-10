"""
KnowFlow Backend - Main Application

Production-grade FastAPI application for AI-powered process intelligence.

Key Features:
- Adaptive AI-led questioning for knowledge extraction
- Structured entity and relationship extraction
- Version-controlled process graphs
- Explainable SOP generation
- Comprehensive risk analysis

Author: KnowFlow Team
Version: 1.0.0
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.core import get_settings
from app.api import (
    processes_router,
    sessions_router,
    graphs_router,
    generation_router,
    auth_router
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("knowflow")


# =============================================================================
# LIFESPAN MANAGEMENT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    logger.info("🚀 KnowFlow Backend starting up...")
    settings = get_settings()
    
    if settings.gemini_api_key:
        logger.info("✅ Gemini API key configured")
    else:
        logger.warning("⚠️ No Gemini API key - AI features will use fallbacks")
    
    yield
    
    # Shutdown
    logger.info("👋 KnowFlow Backend shutting down...")


# =============================================================================
# APPLICATION FACTORY
# =============================================================================

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="""
## KnowFlow API

AI-powered organizational process intelligence system.

### Core Capabilities

- **Adaptive Questioning**: AI-led interviews that evolve based on responses
- **Knowledge Extraction**: Transform conversations into structured entities
- **Process Graphs**: Version-controlled workflow visualization
- **SOP Generation**: Automated documentation with source citations
- **Risk Analysis**: Identify bottlenecks, SPOF, and compliance gaps

### Quick Start

1. Register/Login: `POST /api/v1/auth/register`
2. Create process: `POST /api/v1/processes`
3. Start session: `POST /api/v1/processes/{id}/sessions`
4. Generate SOP: `POST /api/v1/processes/{id}/sop/generate`
        """,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )
    
    # CORS Middleware
    origins = settings.cors_origins.split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Request timing middleware
    @app.middleware("http")
    async def add_timing_header(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        response.headers["X-Process-Time"] = f"{duration:.3f}s"
        return response
    
    # Error handlers
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=400,
            content={"error": "Validation Error", "detail": str(exc)}
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error", "detail": "An unexpected error occurred"}
        )
    
    # Health check
    @app.get("/health", tags=["System"])
    async def health_check():
        """Health check endpoint for load balancers and monitoring."""
        return {
            "status": "healthy",
            "service": "knowflow-backend",
            "version": settings.app_version
        }
    
    # API info
    @app.get("/", tags=["System"])
    async def root():
        """API root with basic info."""
        return {
            "service": "KnowFlow API",
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/health"
        }
    
    # Register routers
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(processes_router, prefix="/api/v1")
    app.include_router(sessions_router, prefix="/api/v1")
    app.include_router(graphs_router, prefix="/api/v1")
    app.include_router(generation_router, prefix="/api/v1")
    
    return app


# Create the application instance
app = create_app()


# =============================================================================
# DEVELOPMENT SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
