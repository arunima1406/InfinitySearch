from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.config import settings

app = FastAPI(
    title="Cloud-Based Semantic Search API",
    description="API for semantic search using cloud storage and vector database",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Cloud-Based Semantic Search API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "cloud_provider": settings.cloud_provider,
        "vector_store": settings.vector_store
    }