import PyPDF2
import docx2txt
import magic
import os
from typing import List, Tuple, Dict
import aiofiles
import logging
from app.services.cloud_storage import CloudStorageService

logger = logging.getLogger(__name__)

class FileProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.mime = magic.Magic(mime=True)
        self.cloud_storage = CloudStorageService()

    async def process_file_from_cloud(self, file_id: str, filename: str, user_id: str) -> Dict:
        """Download file from cloud, process it, and return chunks"""
        try:
            # Download file from cloud
            file_content = self.cloud_storage.download_file(file_id, filename)
            
            # Save temporarily for processing
            temp_path = f"/tmp/{file_id}_{filename}"
            async with aiofiles.open(temp_path, 'wb') as f:
                await f.write(file_content)
            
            # Extract text content
            content = await self._extract_text_content(temp_path, filename)
            
            if not content:
                logger.warning(f"No content extracted from {filename}")
                return {"chunks": [], "content_length": 0}
            
            # Create chunks
            chunks = self.chunk_text(content, filename)
            
            # Clean up temp file
            try:
                os.remove(temp_path)
            except:
                pass
            
            return {
                "chunks": chunks,
                "content_length": len(content),
                "file_type": filename.split('.')[-1] if '.' in filename else 'unknown'
            }
            
        except Exception as e:
            logger.error(f"Error processing file from cloud: {e}")
            return {"chunks": [], "content_length": 0}

    async def _extract_text_content(self, file_path: str, filename: str) -> str:
        """Extract text from various file types"""
        mime_type = self.mime.from_file(file_path)
        
        try:
            if mime_type == 'text/plain':
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    return await f.read()
            
            elif mime_type == 'application/pdf':
                return self._extract_pdf_text(file_path)
            
            elif mime_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                              'application/msword']:
                return self._extract_docx_text(file_path)
            
            else:
                logger.warning(f"Unsupported file type: {mime_type} for {filename}")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}")
            return ""

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF files"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text

    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX files"""
        return docx2txt.process(file_path)

    def chunk_text(self, text: str, filename: str) -> List[Dict]:
        """Split text into overlapping chunks with metadata"""
        if not text.strip():
            return []
        
        words = text.split()
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(words):
            end = start + self.chunk_size
            chunk_content = ' '.join(words[start:end])
            
            chunks.append({
                'content': chunk_content,
                'index': chunk_index,
                'start_pos': start,
                'end_pos': end
            })
            
            chunk_index += 1
            
            if end >= len(words):
                break
                
            start = end - self.chunk_overlap
        
        logger.info(f"Created {len(chunks)} chunks for {filename}")
        return chunks