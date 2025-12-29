"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.api import auth, blog, books, storage


# Create FastAPI app
app = FastAPI(
    title="Portfolio API",
    description="Backend API for Shyam Patadia's Portfolio Website",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
# Configure allowed origins based on environment
if settings.ENVIRONMENT == "production":
    # Production: Allow all origins (GitHub Pages can be on any subdomain)
    # Vercel deployment handles security with proper headers
    allowed_origins = ["*"]
else:
    # Development: Allow common localhost ports and Live Server
    allowed_origins = [
        "http://localhost:8000",
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5502",
        "null",  # Allow file:// protocol
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(blog.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(storage.router, prefix="/api")

# Mount static files (frontend)
static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Portfolio API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Serve the main portfolio page
@app.get("/portfolio")
async def serve_portfolio():
    """Serve the main portfolio HTML"""
    index_path = os.path.join(static_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
