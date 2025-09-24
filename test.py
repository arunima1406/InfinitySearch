from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

uri = os.getenv("NEO4J_URI")          # neo4j+s://b72c5147.databases.neo4j.io
user = os.getenv("NEO4J_USERNAME")        # "neo4j"
password = os.getenv("NEO4J_PASSWORD") 
database = os.getenv("NEO4J_DATABASE") # b72c5147

driver = GraphDatabase.driver(uri, auth=(user, password))

with driver.session(database="b72c5147") as session:
    result = session.run("RETURN 'Hello Neo4j' AS msg")
    print(result.single()["msg"])
