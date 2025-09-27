from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
from typing import List

from app.models.schemas import (
    FileUploadRequest, FileUploadResponse, SearchQuery, 
    SearchResult, RAGResponse, DocumentMetadata
)
from app.services.cloud_storage import CloudStorageService
from app.services.file_processor import FileProcessor
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStoreService
from app.services.rag_service import RAGService

router = APIRouter()

# Initialize services
cloud_storage = CloudStorageService()
file_processor = FileProcessor()
embedding_service = EmbeddingService()
vector_store = VectorStoreService()
rag_service = RAGService()

@router.post("/generate-upload-url", response_model=FileUploadResponse)
async def generate_upload_url(request: FileUploadRequest):
    """Generate pre-signed URL for direct cloud upload"""
    try:
        file_id = str(uuid.uuid4())
        
        # Generate upload URL
        upload_url = cloud_storage.generate_upload_url(
            file_id=file_id,
            filename=request.filename,
            content_type=f"application/{request.file_type}"
        )
        
        # Return URL to mobile app for direct upload
        return FileUploadResponse(
            file_id=file_id,
            filename=request.filename,
            upload_url=upload_url,
            status="ready",
            message="Upload URL generated successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")

@router.post("/process-uploaded-file")
async def process_uploaded_file(background_tasks: BackgroundTasks, file_id: str, filename: str, user_id: str):
    """Process file after it's uploaded to cloud storage"""
    try:
        # Process file in background
        background_tasks.add_task(process_document_after_upload, file_id, filename, user_id)
        
        return {
            "status": "processing", 
            "message": "File is being processed for semantic search",
            "file_id": file_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

async def process_document_after_upload(file_id: str, filename: str, user_id: str):
    """Background task to process uploaded file"""
    try:
        # Process file from cloud storage
        processing_result = await file_processor.process_file_from_cloud(file_id, filename, user_id)
        
        if not processing_result["chunks"]:
            logger.warning(f"No chunks generated for {filename}")
            return
        
        # Generate embeddings for chunks
        chunks_with_embeddings = []
        for chunk in processing_result["chunks"]:
            embedding = embedding_service.get_embedding(chunk['content'])
            chunks_with_embeddings.append({
                **chunk,
                'embedding': embedding
            })
        
        # Prepare document metadata
        document_metadata = {
            'file_id': file_id,
            'filename': filename,
            'file_type': processing_result['file_type'],
            'user_id': user_id,
            'cloud_url': cloud_storage.get_file_url(file_id, filename),
            'file_size': processing_result['content_length'],
            'upload_date': datetime.now().isoformat()
        }
        
        # Store in vector database
        vector_store.store_document_chunks(document_metadata, chunks_with_embeddings)
        
        logger.info(f"Successfully processed {filename} with {len(chunks_with_embeddings)} chunks")
        
    except Exception as e:
        logger.error(f"Error processing uploaded file {filename}: {e}")

@router.post("/search", response_model=List[SearchResult])
async def semantic_search(search_query: SearchQuery):
    """Perform semantic search on user's documents"""
    try:
        # Generate embedding for query
        query_embedding = embedding_service.get_embedding(search_query.query)
        
        # Search vector store
        similar_chunks = vector_store.search_similar_chunks(
            query_embedding=query_embedding,
            user_id=search_query.user_id,
            top_k=search_query.top_k
        )
        
        # Convert to response format
        search_results = []
        for chunk in similar_chunks:
            search_results.append(SearchResult(
                file_id=chunk['metadata']['file_id'],
                filename=chunk['metadata']['filename'],
                content=chunk['content'],
                similarity_score=chunk['similarity_score'],
                file_type=chunk['metadata']['file_type'],
                chunk_index=chunk['metadata']['chunk_index'],
                metadata=chunk['metadata']
            ))
        
        return search_results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/rag", response_model=RAGResponse)
async def rag_search(search_query: SearchQuery):
    """Perform RAG-based question answering"""
    try:
        # Perform semantic search first
        search_results = await semantic_search(search_query)
        
        # Generate RAG response
        rag_response = rag_service.generate_response(search_query.query, search_results)
        
        return RAGResponse(**rag_response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")

@router.get("/documents/{user_id}", response_model=List[DocumentMetadata])
async def get_user_documents(user_id: str):
    """Get all documents for a user"""
    try:
        documents = vector_store.get_user_documents(user_id)
        return documents
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@router.delete("/documents/{user_id}/{file_id}")
async def delete_document(user_id: str, file_id: str):
    """Delete a document and its data"""
    try:
        # Delete from vector store
        vector_success = vector_store.delete_document_chunks(file_id)
        
        # Delete from cloud storage (optional - you might want to keep files)
        # cloud_success = cloud_storage.delete_file(file_id, filename)
        
        if vector_success:
            return {"message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete document")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")