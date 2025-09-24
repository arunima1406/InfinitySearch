import os
import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from neo4j import GraphDatabase
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "password")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

genai.configure(api_key=GEMINI_API_KEY)

class RAGPipeline:
    def __init__(self, model: str, uri: str, user: str, password: str):
        self.model_name = model 
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def _call_gemini(self, prompt: str, max_tokens: int = 512, temperature: float = 0.0) -> str:
        model = genai.GenerativeModel(self.model_name)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
        )
        return response.text.strip()

    def generate_cypher(self, question: str, limit: int = 50) -> Dict[str, Any]:
        prompt = f"""
You are an expert assistant that converts natural-language questions into Cypher queries for Neo4j.

Rules for giving output:
1. ALWAYS return a valid JSON with the following keys: "cypher" and "params".
2. Cypher queries MUST use parameterized inputs with $param (not raw string interpolation).
   Example: {{name:$topic}} instead of {{name:"generative ai"}}.
3. ALWAYS include a $limit parameter (default {limit}) to restrict results.
4. Use only these labels where relevant: Person, Org, Entity, File, Photo, Note.
5. Avoid destructive operations: NEVER use CREATE, DELETE, MERGE, SET, REMOVE, or DROP.
   You are only allowed to MATCH and RETURN.
6. If the question is ambiguous, produce a query that helps in clarification (e.g. list candidate nodes).

Example:
Question: Do I have any documents about generative AI?
Output:
{{"cypher": "MATCH (f:File)-[:TAGGED_WITH]->(t:Entity {{name:$topic}}) RETURN f.name AS file, f.path AS path LIMIT $limit",
  "params": {{"topic":"generative ai","limit":{limit}}}}}

---

Now, follow the rules above strictly and return ONLY JSON.

Question: {question}
"""
        text = self._call_gemini(prompt, max_tokens=600, temperature=0.0)

        # Clean output 
        clean_text = (
            text.replace("```json", "")
                .replace("```", "")
                .strip()
        )

        try:
            cypher_obj = json.loads(clean_text)
            if "params" not in cypher_obj:
                cypher_obj["params"] = {}
            cypher_obj["params"].setdefault("limit", limit)
            return cypher_obj
        except Exception as e:
            raise RuntimeError(f"Failed to parse Gemini output: {e}\nOutput:\n{text}")

    def run_cypher(self, cypher: str, params: Dict[str, Any], max_rows: int = 200) -> List[Dict[str, Any]]:
        forbidden = ["CREATE ", "DELETE ", "MERGE ", "SET ", "REMOVE ", "DROP "]
        if any(k in cypher.upper() for k in forbidden):
            raise ValueError("Unsafe Cypher detected")

        with self.driver.session() as session:
            result = session.run(cypher, **params)
            rows = []
            for i, record in enumerate(result):
                if i >= max_rows:
                    break
                rows.append(dict(record))
            return rows

    def generate_answer(self, question: str, cypher: str, params: Dict[str, Any], rows: List[Dict[str, Any]]) -> str:
        prompt = f"""
You are a helpful assistant that explains query results.

User question: {question}

Cypher used:
{cypher}

Params:
{json.dumps(params, default=str)}

DB rows (preview):
{json.dumps(rows[:10], default=str, indent=2)}

Instructions:
- Write a short, clear answer (2–6 sentences).
- Use DB rows as ground truth.
- If multiple entities are found, list them clearly.
- If the question implies a count or summary, include that in the answer.
- If nothing found, say so and suggest a clarifying question.
"""
        return self._call_gemini(prompt, max_tokens=400, temperature=0.2)

    def run(self, question: str, limit: int = 50) -> Dict[str, Any]:
        cypher_obj = self.generate_cypher(question, limit)
        cypher = cypher_obj.get("cypher")
        params = cypher_obj.get("params", {})
        params.setdefault("limit", limit)

        rows = self.run_cypher(cypher, params, max_rows=limit)
        answer = self.generate_answer(question, cypher, params, rows)

        return {"cypher": cypher, "params": params, "rows": rows, "answer": answer}

app = FastAPI(title="PrismBreak — RAG Orchestrator (Gemini Class Version)")

rag = RAGPipeline(
    model=GEMINI_MODEL,
    uri=NEO4J_URI,
    user=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
)

class ChatRequest(BaseModel):
    query: str
    max_cypher_rows: Optional[int] = 50

class ChatResponse(BaseModel):
    cypher: Optional[str]
    params: Optional[Dict[str, Any]]
    rows: Optional[List[Dict[str, Any]]]
    answer: str

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    try:
        result = rag.run(req.query, limit=req.max_cypher_rows)
        return ChatResponse(
            cypher=result["cypher"],
            params=result["params"],
            rows=result["rows"],
            answer=result["answer"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
