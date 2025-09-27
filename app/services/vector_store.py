#import chromadb
#from chromadb.config import Settings
#import numpy as np
#from typing import List, Dict, Any
#import uuid
#import logging
#from app.config import settings

#logger = logging.getLogger(__name__)

#class VectorStoreService:
 #   def __init__(self):
  #      self.client = None
   #     self.collection = None
    #    self._initialize_client()
    
    #def _initialize_client(self):
     #   try:
      #      self.client = chromadb.PersistentClient(
       #         path=settings.chroma_persist_dir
        #    )
            
            # Create or get collection
         #   self.collection = self.client.get_or_create_collection(
          #      name="document_chunks",
           #     metadata={"description": "Document chunks for semantic search"}
            #)
            #logger.info("Vector store initialized successfully")
            
        #except Exception as e:
         #   logger.error(f"Error initializing vector store: {e}")
          #  raise
    
    #def store_document_chunks(self, document_metadata: Dict, chunks: List[Dict]) -> bool:
     #   """Store document chunks in vector database"""
      #  try:
       #     documents = []
         #   metadatas = []
        #    ids = []
          #  embeddings = []
            
           # for chunk in chunks:
            #    chunk_id = str(uuid.uuid4())
             #   documents.append(chunk['content'])
              #  metadatas.append({
               #     'file_id': document_metadata['file_id'],
                #    'filename': document_metadata['filename'],
                 #   'file_type': document_metadata['file_type'],
                  #  'user_id': document_metadata['user_id'],
                   # 'chunk_index': chunk['index'],
                    #'cloud_url': document_metadata['cloud_url']
                #})
                #ids.append(chunk_id)
                #embeddings.append(chunk['embedding'])
            
            #self.collection.add(
             #   embeddings=embeddings,
              #  documents=documents,
               # metadatas=metadatas,
                #ids=ids
            #)
            
            #logger.info(f"Stored {len(chunks)} chunks for {document_metadata['filename']}")
            #return True
            
        #except Exception as e:
          #  logger.error(f"Error storing document chunks: {e}")
           # return False
    
   # def search_similar_chunks(self, query_embedding: List[float], user_id: str, top_k: int = 5) -> List[Dict]:
        """Search for similar chunks using vector similarity"""
      #  try:
        #    results = self.collection.query(
           #     query_embeddings=[query_embedding],
        #        n_results=top_k,
               # where={"user_id": user_id}  # Filter by user
           # )
            
           # similar_chunks = []
            #for i in range(len(results['documents'][0])):
             #   similar_chunks.append({
                 #   'content': results['documents'][0][i],
                  #  'metadata': results['metadatas'][0][i],
                    'similarity_score': 1 - results['distances'][0][i] if results['distances'] else 0.0
               # })
            
           # return similar_chunks
            
        #except Exception as e:
            #logger.error(f"Error searching similar chunks: {e}")
           # return []
    
    #def delete_document_chunks(self, file_id: str) -> bool:
        """Delete all chunks for a specific document"""
        #try:
         #   # First get all chunks for this file
            #results = self.collection.get(where={"file_id": file_id})
            
            #if results['ids']:
              #  self.collection.delete(ids=results['ids'])
               # logger.info(f"Deleted {len(results['ids'])} chunks for file {file_id}")
            
          #  return True
            
        #except Exception as e:
            #logger.error(f"Error deleting document chunks: {e}")
            #return False
    
   # def get_user_documents(self, user_id: str) -> List[Dict]:
        """Get all documents for a user"""
        #try:
           # results = self.collection.get(where={"user_id": user_id})
            
            # Group by file_id
          #  documents = {}
           # for i, metadata in enumerate(results['metadatas']):
              #  file_id = metadata['file_id']
               # if file_id not in documents:
                   # documents[file_id] = {
                     #   'file_id': file_id,
                      #  'filename': metadata['filename'],
                       # 'file_type': metadata['file_type'],
                       # 'user_id': metadata['user_id'],
                       # 'cloud_url': metadata['cloud_url'],
                       # 'chunks_count': 0
                   # }
              #  documents[file_id]['chunks_count'] += 1
            
            #return list(documents.values())
            
        #except Exception as e:
           # logger.error(f"Error getting user documents: {e}")
           # return []