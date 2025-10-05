from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Cloud Storage
    
    # App
    upload_dir: str = "./temp_uploads"
    max_file_size: int = 10485760
    
    class Config:
        env_file = ".env"
        extra = "allow"  

settings = Settings()