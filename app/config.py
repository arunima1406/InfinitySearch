from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Cloud Storage
    cloud_provider: str = "aws"
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    s3_bucket_name: Optional[str] = None
    gcp_project_id: Optional[str] = None
    gcs_bucket_name: Optional[str] = None
    
    # Vector Store
    vector_store: str = "chromadb"
    chroma_persist_dir: str = "./chroma_db"
    
    # AI/ML
    openai_api_key: Optional[str] = None
    embedding_model: str = "all-MiniLM-L6-v2"
    rag_model: str = "gpt-3.5-turbo"
    
    # App
    upload_dir: str = "./temp_uploads"
    max_file_size: int = 10485760
    
    class Config:
        env_file = ".env"

settings = Settings()