"""
Knowledge Graph Manager (Member 3)
-----------------------------------
This script connects to Neo4j AuraDB, inserts triples,
and allows querying the graph.

Author: Member 3
"""

from neo4j import GraphDatabase
from typing import List, Dict

# ---------- CONFIG ----------
URI = "neo4j+s://b72c5147.databases.neo4j.io"  # replace with AuraDB URI
USER = "b72c5147"
PASSWORD = "kz9Z7GIzcGG01bneImmmNGr0dRFyAiDSvH_L14SlcUw"  # the one you saved when creating instance

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

# ---------- FUNCTIONS ----------

def insert_triple(tx, start: str, relation: str, end: str, source: str = None):
    """
    Insert a triple (Entity1 -[REL]-> Entity2) into Neo4j.
    """
    query = f"""
    MERGE (a:Entity {{name: $start}})
    MERGE (b:Entity {{name: $end}})
    MERGE (a)-[r:{relation}]->(b)
    ON CREATE SET r.source = $source
    """
    tx.run(query, start=start, end=end, source=source)

def insert_triples(triples: List[Dict]):
    """
    Insert a list of triples (from Member 2).
    Example triple:
    {"start": "Alice", "relation": "WORKS_AT", "end": "Samsung", "source": "doc1"}
    """
    with driver.session() as session:
        for t in triples:
            relation = t["relation"].upper().replace(" ", "_")  # normalize relation
            session.execute_write(
                insert_triple, t["start"], relation, t["end"], t.get("source", "unknown")
            )
    print(f"✅ Inserted {len(triples)} triples into Neo4j!")

def query_subgraph(entity: str, hops: int = 2):
    """
    Query N-hop neighborhood around an entity.
    """
    query = f"""
    MATCH path=(a:Entity {{name:$name}})-[*1..{hops}]-(b)
    UNWIND relationships(path) AS r
    RETURN startNode(r).name AS start,
           type(r) AS relation,
           endNode(r).name AS end
    """
    results = []
    with driver.session() as session:
        rows = session.run(query, name=entity)  # only pass 'name' as parameter
        for row in rows:
            results.append((row["start"], row["relation"], row["end"]))
    return results


# ---------- TESTING ----------
if __name__ == "__main__":
    # Example triples (replace with Member 2’s JSON later)
    triples = [
        {"start": "Alice", "relation": "WORKS_AT", "end": "Samsung", "source": "doc_123"},
        {"start": "Bob", "relation": "WORKS_AT", "end": "Google", "source": "doc_124"},
        {"start": "Alice", "relation": "COLLABORATED_WITH", "end": "Bob", "source": "doc_125"}
    ]

    # Insert sample triples
    insert_triples(triples)

    # Query subgraph around Alice
    subgraph = query_subgraph("Alice", hops=2)
    print("🔎 Subgraph around Alice:")
    for s, r, e in subgraph:
        print(f"({s}) -[{r}]-> ({e})")

    driver.close()
