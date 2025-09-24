import os
import json
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
# This is the most important fix!
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
- "relation": A descriptive, uppercase, snake_case name for the relationship (e.g., WORKS_AT, LOCATED_IN, BORN_ON).
- "end": The object or ending entity of the relationship.

Do not include any relationships that are not explicitly stated in the text. Do not add any explanations or introductory text outside of the JSON array.
"""

# --- Execution ---
try:
    # 4. Load text chunks from the file provided by Member 1
    with open("step1.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    chunks = data["chunks"]
    
    all_triples = []
    
    print(f"Found {len(chunks)} chunks to process...")

    # 5. Process each chunk with the more robust API call
    for i, chunk in enumerate(chunks, start=1):
        print(f"\n🔎 Processing chunk {i}/{len(chunks)}...")

        # The new, cleaner way to send the prompt
        prompt_parts = [
            SYSTEM_PROMPT,
            "Text to analyze:",
            chunk
        ]
        
        response = model.generate_content(prompt_parts)
        
        # 6. No more "try-except" for parsing! The API guarantees valid JSON.
        triples = json.loads(response.text)
        print(f"✅ Extracted {len(triples)} triples from chunk {i}.")
        all_triples.extend(triples)

except FileNotFoundError:
    print("Error: `step1.json` not found. Please create it with the text chunks.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# --- Output ---
# 7. Save the final combined list of triples for Member 3
output_filename = "triples_gemini.json"
with open(output_filename, "w", encoding="utf-8") as f:
    json.dump(all_triples, f, indent=2, ensure_ascii=False)

print(f"\n\n📊 Total triples extracted: {len(all_triples)}")
print(f"Results saved to '{output_filename}'")