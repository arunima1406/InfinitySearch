import os
import re
import json
from typing import List, Dict

from dotenv import load_dotenv
from neo4j import GraphDatabase
import boto3
import google.generativeai as genai

# ---------------- CONFIG ----------------
load_dotenv()

# Neo4j
URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

# AWS
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET = os.getenv("S3_BUCKET")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
embedding_model = "models/text-embedding-004"   # Gemini embedding model

# Neo4j Driver
driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))


# ---------------- EMBEDDINGS ----------------
def generate_embedding(text: str) -> List[float]:
    """Generate embedding vector from Gemini for given text."""
    if not text.strip():
        return []
    try:
        result = genai.embed_content(model=embedding_model, content=text)
        return result["embedding"]
    except Exception as e:
        print("⚠️ Embedding generation failed:", e)
        return []


# ---------------- S3 HELPERS ----------------
def list_user_json_files(bucket: str, user_id: str):
    prefix = f"kg-json/"
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix=prefix)
    if "Contents" not in response:
        return []
    return [obj["Key"] for obj in response["Contents"] if obj["Key"].endswith(".json")]


def load_json_from_s3(bucket: str, key: str) -> dict:
    response = s3_client.get_object(Bucket=bucket, Key=key)
    content = response["Body"].read().decode("utf-8")
    return json.loads(content)


# ---------------- NEO4J INSERT ----------------
def insert_triple(tx, start: str, relation: str, end: str,
                  source: str, episode_id: str, summary: str,
                  user_id: str, embedding: List[float]):
    query = f"""
    MERGE (a:Entity {{name:$start, user_id:$user_id}})
    MERGE (b:Entity {{name:$end, user_id:$user_id}})
    MERGE (a)-[r:{relation} {{episode_id:$episode_id, user_id:$user_id}}]->(b)
    MERGE (ep:Episode {{id:$episode_id, user_id:$user_id}})
      ON CREATE SET ep.source_file=$source, ep.summary=$summary, ep.embedding=$embedding
      ON MATCH SET ep.embedding=$embedding
    MERGE (ep)-[:MENTIONS {{user_id:$user_id}}]->(a)
    MERGE (ep)-[:MENTIONS {{user_id:$user_id}}]->(b)
    """
    tx.run(query, start=start, end=end, source=source,
           episode_id=episode_id, summary=summary,
           user_id=user_id, embedding=embedding)


def insert_triples(triples: List[Dict], user_id: str):
    inserted_count = 0
    with driver.session() as session:
        for t in triples:
            relation = t["relation"].upper()
            relation = re.sub(r"[^A-Z0-9_]", "_", relation)

            embedding_vector = generate_embedding(t["summary"])

            session.execute_write(
                insert_triple,
                t["start"], relation, t["end"],
                t["source_file"], t["episode_id"], t["summary"], user_id, embedding_vector
            )
            inserted_count += 1
    print(f"✅ Inserted {inserted_count} triples into Neo4j for user {user_id}!")

def create_vector_index():
    """Create vector index only if it doesn't exist using Neo4j 5.x vector syntax."""
    with driver.session() as session:
        try:
            # Check if index already exists
            existing_indexes = session.run("SHOW INDEXES YIELD name").values()
            if any("episode_index" in idx for idx in existing_indexes):
                print("ℹ️ Vector index 'episode_index' already exists, skipping.")
                return

            # Correct Neo4j vector index creation
            session.run(
                "CREATE VECTOR INDEX episode_index "
                "FOR (e:Episode) "
                "ON (e.embedding) "
                "OPTIONS {indexProvider: 'vector-3.0', "
                "indexConfig: {`vector.dimensions`: 768, `vector.similarity_function`: 'cosine'}}"
            )
            print("✅ Vector index 'episode_index' created successfully!")
        except Exception as e:
            print("⚠️ Failed to create vector index:", e)

# ---------------- MAIN ----------------
if __name__ == "__main__":
    user_id = "test_user_123"

    json_files = list_user_json_files(S3_BUCKET, user_id)
    if not json_files:
        print(f"⚠️ No JSON files found for user {user_id} in {S3_BUCKET}")
    else:
        print(f"📂 Found {len(json_files)} files for {user_id}: {json_files}")

    total_triples = 0
    for key in json_files:
        print(f"⬇️ Processing {key} ...")
        data = load_json_from_s3(S3_BUCKET, key)

        triples = []
        for kg_item in data.get("knowledge_graph", []):
            source_file = kg_item.get("source_file", "unknown")
            episode_id = kg_item.get("episode_id", "unknown")
            summary = kg_item.get("summary", "")
            triples_dict = kg_item.get("triples", {})

            for _, t in triples_dict.items():
                if not t.get("start") or not t.get("end") or not t.get("relation"):
                    continue
                triples.append({
                    "start": t["start"],
                    "relation": t["relation"],
                    "end": t["end"],
                    "source_file": source_file,
                    "episode_id": episode_id,
                    "summary": summary
                })

        print(f"✅ Prepared {len(triples)} triples from {key}")
        insert_triples(triples, user_id)
        total_triples += len(triples)

    print(f"🎉 Finished ingesting {total_triples} triples for user {user_id}")

    # Create vector index
    create_vector_index()

    driver.close()
