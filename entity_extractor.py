import json
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Load sample text
with open("sampletext.json", "r") as f:
    data = json.load(f)

text = data["text"]
doc = nlp(text)

# Extract entities
entities = [(ent.text, ent.label_) for ent in doc.ents]
print("Entities found:", entities)

# Create simple relationships (example rules)
triples = []

for sent in doc.sents:
    s = sent.text
    if "works at" in s:
        ents = [ent.text for ent in nlp(s).ents]
        if len(ents) >= 2:
            triples.append({"start": ents[0], "relation": "WORKS_AT", "end": ents[1]})
    elif "born in" in s:
        ents = [ent.text for ent in nlp(s).ents]
        if len(ents) >= 2:
            triples.append({"start": ents[0], "relation": "BORN_IN", "end": ents[1]})
    elif "studies at" in s:
        ents = [ent.text for ent in nlp(s).ents]
        if len(ents) >= 2:
            triples.append({"start": ents[0], "relation": "STUDIES_AT", "end": ents[1]})

# Save triples for Neo4j
with open("triples.json", "w") as f:
    json.dump(triples, f, indent=2)

print("Triples saved:", triples)
