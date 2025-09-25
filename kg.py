from neo4j import GraphDatabase
from typing import List, Dict
import json

# ---------- CONFIG ----------
URI = "neo4j+s://b72c5147.databases.neo4j.io"
USER = "b72c5147"
PASSWORD = "kz9Z7GIzcGG01bneImmmNGr0dRFyAiDSvH_L14SlcUw"
JSON_PATH = "knowledge_graph.json"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

# ---------- FUNCTIONS ----------

def insert_triple(tx, start: str, relation: str, end: str, source: str, episode_id: str, summary: str):
    """
    Insert triple and link it to an Episode node.
    """
    query = f"""
    MERGE (a:Entity {{name: $start}})
    MERGE (b:Entity {{name: $end}})
    MERGE (a)-[r:{relation} {{episode_id:$episode_id}}]->(b)
    MERGE (ep:Episode {{id:$episode_id}})
      ON CREATE SET ep.source_file=$source, ep.summary=$summary
    MERGE (ep)-[:MENTIONS]->(a)
    MERGE (ep)-[:MENTIONS]->(b)
    """
    tx.run(query, start=start, end=end, source=source,
           episode_id=episode_id, summary=summary)


def insert_triples(triples: List[Dict]):
    inserted_count = 0
    with driver.session() as session:
        for t in triples:
            start = t["start"]
            end = t["end"]
            relation = t["relation"].upper().replace(" ", "_")
            session.execute_write(
                insert_triple,
                start, relation, end,
                t["source_file"], t["episode_id"], t["summary"]
            )
            inserted_count += 1
    print(f"✅ Inserted {inserted_count} triples into Neo4j!")


def query_subgraph(entity: str, hops: int = 2):
    query = f"""
    MATCH path=(a:Entity {{name:$name}})-[*1..{hops}]-(b)
    UNWIND relationships(path) AS r
    RETURN startNode(r).name AS start,
           type(r) AS relation,
           endNode(r).name AS end,
           r.episode_id AS episode
    """
    results = []
    with driver.session() as session:
        rows = session.run(query, name=entity)
        for row in rows:
            results.append((row["start"], row["relation"], row["end"], row["episode"]))
    return results


# ---------- MAIN ----------
if __name__ == "__main__":
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

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

    print(f"✅ Prepared {len(triples)} triples for ingestion")
    insert_triples(triples)

    # Interactive query
    entity_to_query = input("🔍 Enter entity to explore: ")
    subgraph = query_subgraph(entity_to_query, hops=2)
    print(f"🔎 Subgraph around {entity_to_query}:")
    for s, r, e, ep in subgraph:
        print(f"({s}) -[{r}]-> ({e}) [episode:{ep}]")

    driver.close()
