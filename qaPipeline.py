"""
QA Pipeline (Member 4)
-----------------------
- Takes natural language questions
- Converts them to Cypher queries (Gemini LLM)
- Runs queries on Neo4j AuraDB (from Member 3)
- Returns a natural language answer

Requirements:
    pip install neo4j google-generativeai python-dotenv
"""

import os
from neo4j import GraphDatabase
import google.generativeai as genai
from dotenv import load_dotenv

# ---------- CONFIG ----------
load_dotenv()  # load from .env file

# AuraDB credentials (set in .env file for safety)
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://<your-id>.databases.neo4j.io")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "<your-password>")

# Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "<your-gemini-key>")
genai.configure(api_key=GEMINI_API_KEY)

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


# ---------- STEP 1: Run Cypher ----------
def run_cypher(query: str, params: dict = {}):
    """
    Run a Cypher query and return results as list of dicts
    """
    with driver.session() as session:
        result = session.run(query, **params)
        return [dict(r) for r in result]


# ---------- STEP 2: NL -> Cypher ----------
def nl_to_cypher(question: str) -> str:
    """
    Convert natural language question into Cypher query using Gemini
    """
    system_prompt = """
    You are an assistant that converts natural language questions
    into Neo4j Cypher queries. 
    The graph has nodes with label :Entity and property 'name'.
    Relationships include: WORKS_AT, COLLABORATED_WITH, AUTHORED.
    Always return Cypher only, no explanations.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")

    response = model.generate_content(
        f"{system_prompt}\nUser Question: {question}"
    )

    cypher_query = response.text.strip()
    return cypher_query


# ---------- STEP 3: Generate Final Answer ----------
def generate_answer(question: str, results: list) -> str:
    """
    Generate a natural language answer given raw query results
    """
    context = "\n".join([str(r) for r in results]) if results else "No data found."
    prompt = f"""
    Question: {question}
    Data from graph: 
    {context}

    Answer in simple natural language:
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()


# ---------- STEP 4: Pipeline ----------
def ask_question(question: str):
    cypher = nl_to_cypher(question)
    print(f"🔎 Generated Cypher:\n{cypher}\n")

    results = run_cypher(cypher)
    print("📊 Raw Results:", results)

    answer = generate_answer(question, results)
    return answer


# ---------- MAIN ----------
if __name__ == "__main__":
    while True:
        q = input("\nAsk a question (or type 'exit'): ")
        if q.lower() == "exit":
            break
        ans = ask_question(q)
        print(f"\n🤖 Answer: {ans}\n")

    driver.close()
