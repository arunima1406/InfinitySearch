import os
from neo4j import GraphDatabase
import google.generativeai as genai

from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASS = os.environ.get("NEO4J_PASSWORD", "password")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "text-embedding-004")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing in .env")

genai.configure(api_key=GEMINI_API_KEY)

# Neo4j connection setup
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

def get_embedding(text):
    """Get Gemini embedding for a text"""
    response = genai.embed_content(model=EMBED_MODEL, content=text)
    return response["embedding"]

# Fetch and update nodes 
with driver.session() as session:
    result = session.run("MATCH (e:Episode) RETURN e.episode_id AS id, e.summary AS summary")
    for record in result:
        episode_id = record["id"]
        summary = record["summary"]

        if not summary:
            print(f"Skipping episode {episode_id}: no summary")
            continue

        embedding = get_embedding(summary)

        session.run(
            """
            MATCH (e:Episode {episode_id:$episode_id})
            SET e.embedding = $embedding
            """,
            {"episode_id": episode_id, "embedding": embedding}
        )
        print(f"Added embeddings for episode {episode_id}")

print("All embeddings have been created")
