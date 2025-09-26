import os
import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from neo4j import GraphDatabase
import google.generativeai as genai

load_dotenv()

# Env variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "text-embedding-004")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

genai.configure(api_key=GEMINI_API_KEY)


# RAG Pipeline
class RAGPipeline:
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def embed(self, text: str) -> List[float]:
        """Generate Gemini embeddings for text"""
        model = genai.GenerativeModel(EMBED_MODEL)
        response = genai.embed_content(model=EMBED_MODEL, content=text)
        return response["embedding"]

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Run vector similarity search in Neo4j"""
        query_embedding = self.embed(query)

        cypher = """
        CALL db.index.vector.queryNodes('episode_index', $top_k, $embedding)
        YIELD node, score
        RETURN node.source_file AS source_file,
               node.episode_id AS episode_id,
               node.summary AS summary,
               score
        """
        with self.driver.session() as session:
            results = session.run(cypher, {
                "embedding": query_embedding,
                "top_k": top_k
            })
            return [dict(record) for record in results]

    def extract_episode_summaries(self, rows: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Deduplicate and return unique episode summaries"""
        episodes_map = {}
        for r in rows:
            source_file = r.get("source_file", "unknown")
            if source_file not in episodes_map:
                episodes_map[source_file] = {
                    "source_file": source_file,
                    "episode_id": r.get("episode_id", "unknown"),
                    "summary": r.get("summary", "")
                }
        return list(episodes_map.values())


# FastAPI Backend
app = FastAPI(title="PrismBreak — Semantic RAG with Episode Summaries")

rag = RAGPipeline(
    uri=NEO4J_URI,
    user=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
)


class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class ChatResponse(BaseModel):
    episodes: List[Dict[str, str]]


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        rows = rag.semantic_search(req.query, top_k=req.top_k)
        episodes = rag.extract_episode_summaries(rows)
        return ChatResponse(episodes=episodes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
