import os
import json
import time
import uuid
import google.generativeai as genai
from dotenv import load_dotenv

# --- Setup ---
# 1. Load the API key securely from a .env file
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("API key not found. Please set GOOGLE_API_KEY in your .env file.")

genai.configure(api_key=api_key)

# 2. Configure the model to GUARANTEE JSON output
generation_config = {
  "response_mime_type": "application/json",
}
model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    generation_config=generation_config
)

# 3. System Prompt (Refined and proven to work well)
SYSTEM_PROMPT = """
You are an expert information extraction agent. Your task is to analyze the user's text and extract knowledge triples.

Output ONLY a valid JSON array of objects. Each object represents a single relationship and must have three keys: "start", "relation", and "end".

- The "relation" value must be descriptive, uppercase, and snake_case (e.g., PROPOSED, PROPOSED_IN).
- Do not add any explanations or introductory text outside of the main JSON array.

Example for "Alan Turing proposed the universal machine in 1936.":
[
  {
    "start": "Alan Turing",
    "relation": "PROPOSED",
    "end": "universal machine"
  },
  {
    "start": "universal machine",
    "relation": "PROPOSED_IN",
    "end": "1936"
  }
]
"""

# --- Execution ---
try:
    with open("chunks.json", "r", encoding="utf-8") as f:
        source_files_data = json.load(f)

    final_knowledge_graph = []
    print(f"Found {len(source_files_data)} source file(s) to process...")

    for file_data in source_files_data:
        source_file = file_data.get("source_file", "Unknown_Source")
        print(f"\n--- Processing source: {source_file} ---")

        # **NEW:** Generate a unique ID for this document's "episode"
        episode_id = f"ep_{uuid.uuid4()}"

        texts_to_process = []
        texts_to_process.extend(file_data.get("text_chunks", []))
        for image in file_data.get("extracted_images", []):
            if image.get("description"):
                texts_to_process.append(image.get("description"))

        if not texts_to_process:
            print("No text found. Skipping.")
            continue
            
        all_triples_from_ai = []
        
        for i, text_chunk in enumerate(texts_to_process, start=1):
            print(f"  🔎 Processing text part {i}/{len(texts_to_process)}...")
            prompt_parts = [SYSTEM_PROMPT, "Text to analyze:", text_chunk]
            
            try:
                response = model.generate_content(prompt_parts)
                list_of_dicts = json.loads(response.text)
                print(f"  ✅ Extracted {len(list_of_dicts)} triples.")
                all_triples_from_ai.extend(list_of_dicts)
                time.sleep(2) # Respect API rate limits
            except Exception as e:
                print(f"  ⚠️ Error processing a text part: {e}")

        triples_dict = {}
        for i, triple_obj in enumerate(all_triples_from_ai, start=1):
            if isinstance(triple_obj, dict) and "start" in triple_obj and "relation" in triple_obj and "end" in triple_obj:
                triples_dict[str(i)] = triple_obj
            else:
                print(f"  ⚠️ Skipping malformed triple from AI: {triple_obj}")

        # Add the final structure including the new episode_id
        final_knowledge_graph.append({
            "source_file": source_file,
            "episode_id": episode_id, # Add the new ID here
            "triples": triples_dict
        })


except FileNotFoundError:
    print("Error: `chunks.json` not found.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# --- Output ---
output_filename = "triples_with_episodes.json"
with open(output_filename, "w", encoding="utf-8") as f:
    json.dump({"knowledge_graph": final_knowledge_graph}, f, indent=4, ensure_ascii=False)

print(f"\n\n📊 Knowledge graph extraction complete.")
print(f"Results saved to '{output_filename}'")