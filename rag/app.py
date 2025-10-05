

import os
import logging
import concurrent.futures
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from neo4j import GraphDatabase
import google.generativeai as genai

# ------------------ Setup ------------------
#load_dotenv()  # Load .env file


from dotenv import load_dotenv
load_dotenv() 

# Env variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")
NEO4J_DATABASE = os.environ.get("NEO4J_DATABASE", "neo4j")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "text-embedding-004")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

genai.configure(api_key=GEMINI_API_KEY)
logging.basicConfig(level=logging.INFO)

# ------------------ Timeout Helper ------------------
def run_with_timeout(func, *args, timeout: int = 15, **kwargs):
    """Run a function with timeout (cross-platform)."""
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(func, *args, **kwargs)
        try:
            return future.result(timeout=timeout)
        except concurrent.futures.TimeoutError:
            raise TimeoutError(f"Operation timed out after {timeout}s")

# ------------------ RAG Pipeline ------------------
class RAGPipeline:
    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database

    def embed(self, text: str) -> List[float]:
        """Generate Gemini embeddings for text"""
        logging.info("Generating embedding for query...")
        return run_with_timeout(
            genai.embed_content,
            model=EMBED_MODEL,
            content=text,
            timeout=15
        )["embedding"]

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Run vector similarity search in Neo4j"""
        query_embedding = self.embed(query)

        cypher = """
        CALL db.index.vector.queryNodes('episode_index', $top_k, $embedding)
        YIELD node, score
        RETURN node.source_file AS source_file,
               node.episode_id AS episode_id,
               node.summary AS summary,
               node.user_id AS user_id,
               score
        """
        logging.info("Running Neo4j vector search...")
        with self.driver.session(database=self.database) as session:
            def run_query():
                return session.run(cypher, {
                    "embedding": query_embedding,
                    "top_k": top_k
                })

            results = run_with_timeout(run_query, timeout=15)
            rows = [dict(record) for record in results]

        logging.info(f"Neo4j returned {len(rows)} rows")
        logging.info(f"Retrieved rows: {rows}")
        return rows

    def extract_episodes(self, rows: List[Dict[str, Any]], min_score: float = 0.5) -> List[Dict[str, Any]]:
        """Return episodes with scores above min_score"""
        episodes = []
        for r in rows:
            score = r.get("score", 0.0)
            if score >= min_score:
                episodes.append({
                    "source_file": r.get("source_file") or "unknown",
                    "episode_id": r.get("episode_id") or "unknown",
                    "summary": r.get("summary") or "",
                    "user_id": r.get("user_id") or "unknown",
                    "score": score
                })
        return episodes

# ------------------ FastAPI Backend ------------------
app = FastAPI(title="PrismBreak — Semantic RAG with User Context")

rag = RAGPipeline(
    uri=NEO4J_URI,
    user=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
    database=NEO4J_DATABASE,
)

# ------------------ Models ------------------
class EpisodeResponse(BaseModel):
    source_file: str
    episode_id: str
    summary: str
    user_id: str
    score: float

class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    min_score: Optional[float] = 0.5

class ChatResponse(BaseModel):
    episodes: List[EpisodeResponse]

# ------------------ Endpoints ------------------
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        logging.info(f"Received query: {req.query}")
        rows = rag.semantic_search(req.query, top_k=req.top_k)
        episodes = rag.extract_episodes(rows, min_score=req.min_score)

        if not episodes:
            return ChatResponse(episodes=[EpisodeResponse(
                source_file="N/A",
                episode_id="N/A",
                summary="No matching episodes found. Try rephrasing your query.",
                user_id="N/A",
                score=0.0
            )])

        return ChatResponse(episodes=[EpisodeResponse(**ep) for ep in episodes])

    except TimeoutError as te:
        logging.error(f"Timeout: {te}")
        raise HTTPException(status_code=504, detail=str(te))
    except Exception as e:
        logging.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



