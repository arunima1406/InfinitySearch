from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class FileUploadRequest(BaseModel):
    filename: str
    file_type: str
    user_id: str

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    upload_url: str
    status: str
    message: str

class SearchQuery(BaseModel):
    query: str
    user_id: str
    top_k: int = 5
    similarity_threshold: float = 0.7

class SearchResult(BaseModel):
    file_id: str
    filename: str
    content: str
    similarity_score: float
    file_type: str
    chunk_index: int
    metadata: Dict[str, Any]

class RAGResponse(BaseModel):
    answer: str
    source_documents: List[SearchResult]
    confidence: float

class DocumentMetadata(BaseModel):
    file_id: str
    filename: str
    file_type: str
    file_size: int
    user_id: str
    upload_date: datetime
    chunks_count: int
    cloud_url: str