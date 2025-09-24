import os
import json
import time
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
    "gemini-1.5-flash",
    generation_config=generation_config
)

# 3. Improved system prompt for clarity
SYSTEM_PROMPT = """
You are an expert information extraction agent. Your task is to analyze the user's text and extract knowledge triples.

Output a valid JSON array of objects. Each object represents a single relationship and must have three keys: "start", "relation", and "end".

- "start": The subject or starting entity of the relationship.
- "relation": A descriptive, uppercase, snake_case name for the relationship (e.g., IS_A, HAS_PHASE, SUITABLE_FOR).
- "end": The object or ending entity of the relationship.

Do not include any relationships that are not explicitly stated in the text. Do not add any explanations or introductory text outside of the JSON array.
"""

# --- Execution ---
try:
    # 4. Load the list of source file data from Member 1
    with open("step1.json", "r", encoding="utf-8") as f:
        source_files_data = json.load(f)

    # This will hold the final structured output
    final_knowledge_graph = []

    print(f"Found {len(source_files_data)} source file(s) to process...")

    # 5. Process each source file object
    for file_data in source_files_data:
        source_file = file_data.get("source_file", "Unknown_Source")
        print(f"\n--- Processing source: {source_file} ---")

        # Combine text chunks and image descriptions into one list to process
        texts_to_process = []
        texts_to_process.extend(file_data.get("text_chunks", []))
        for image in file_data.get("extracted_images", []):
            if image.get("description"):
                texts_to_process.append(image.get("description"))

        if not texts_to_process:
            print("No text chunks or image descriptions found. Skipping.")
            continue
            
        file_triples = []
        
        # 6. Process each piece of text from the combined list
        for i, text_chunk in enumerate(texts_to_process, start=1):
            print(f"  🔎 Processing text part {i}/{len(texts_to_process)}...")

            prompt_parts = [SYSTEM_PROMPT, "Text to analyze:", text_chunk]
            
            try:
                response = model.generate_content(prompt_parts)
                triples = json.loads(response.text)
                print(f"  ✅ Extracted {len(triples)} triples.")
                file_triples.extend(triples)
                
                # Add a delay to respect API rate limits
                time.sleep(2) 
            except Exception as e:
                print(f"  ⚠️ Error processing a text part: {e}")


        # Add the collected triples for this file to our final structure
        final_knowledge_graph.append({
            "source_file": source_file,
            "triples": file_triples
        })


except FileNotFoundError:
    print("Error: `step1.json` not found. Please create it with the text chunks.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# --- Output ---
# 7. Save the final structured graph for Member 3
output_filename = "triples_gemini.json"
with open(output_filename, "w", encoding="utf-8") as f:
    json.dump({"knowledge_graph": final_knowledge_graph}, f, indent=4, ensure_ascii=False)

print(f"\n\n📊 Knowledge graph extraction complete.")
print(f"Results saved to '{output_filename}'")