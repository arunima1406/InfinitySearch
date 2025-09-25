import pdfplumber
import fitz
import re
import json
import glob
import os
import time
import uuid
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv
import docx
import csv
import openpyxl
from pptx import Presentation

# --- Configuration ---
# Directory to save extracted images
IMAGE_OUTPUT_DIR = "extracted_images"
# Directory to save intermediate chunk files for debugging
INTERMEDIATE_CHUNKS_DIR = "intermediate_chunks"
# Set to True to save the chunks for each file as a separate JSON
SAVE_INTERMEDIATE_CHUNKS = True
# Parameters for text chunking
CHUNK_SIZE = 250  # Increased for better context
OVERLAP_SIZE = 50
# Max text length to send for summarization to avoid API errors
MAX_TEXT_LENGTH_FOR_SUMMARY = 200000
# Gemini model for quick tasks like descriptions and summaries
QUICK_TASK_MODEL = 'gemini-2.5-flash-lite'
# Gemini model for the more complex knowledge extraction task
EXTRACTION_MODEL = 'gemini-2.5-flash-lite'
# API call delay to respect rate limits
API_DELAY_SECONDS = 3
# ---------------------

# --- Setup ---
# Load API Key from .env file
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("API key not found. Please set GOOGLE_API_KEY in your .env file.")
genai.configure(api_key=api_key)

# --- Gemini Models and Prompts ---
# Reusable model instances
quick_model = genai.GenerativeModel(QUICK_TASK_MODEL)
extraction_model = genai.GenerativeModel(
    EXTRACTION_MODEL,
    generation_config={"response_mime_type": "application/json"}
)

# Prompt for extracting knowledge triples
TRIPLE_EXTRACTION_PROMPT = """
You are an expert information extraction agent. Your task is to analyze the user's text and extract knowledge triples.

Output ONLY a valid JSON array of objects. Each object represents a single relationship and must have three keys: "start", "relation", and "end".

- The "relation" value must be descriptive, uppercase, and snake_case (e.g., PROPOSED, PROPOSED_IN, IS_A).
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

# --- Helper Functions (from Member 1's logic) ---

def describe_image_with_gemini(image_path):
    print(f"      > Describing image: {os.path.basename(image_path)}...")
    try:
        img = Image.open(image_path)
        prompt = "Directly describe the content of this image in one factual, declarative sentence. Start the sentence with the main subject. Do not use phrases like 'This image shows' or 'The diagram depicts'."
        response = quick_model.generate_content([prompt, img])
        time.sleep(API_DELAY_SECONDS)
        return response.text.strip()
    except Exception as e:
        print(f"        ! Error describing image: {e}")
        return "Error during image description."

def summarize_text_with_gemini(text):
    print("    > Summarizing document text...")
    if len(text) > MAX_TEXT_LENGTH_FOR_SUMMARY:
        text = text[:MAX_TEXT_LENGTH_FOR_SUMMARY]
        print("      ! Text was truncated for summarization due to extreme length.")
    try:
        prompt = "Analyze the following. Synthesize its core subject and key points into a single, concise, and factual paragraph. Describe the content directly as if explaining it, starting with the main subject. Do not use third-person language like 'This text is about' or 'The author discusses'."
        response = quick_model.generate_content([prompt, text])
        time.sleep(API_DELAY_SECONDS)
        return response.text.strip()
    except Exception as e:
        print(f"      ! Error during text summarization: {e}")
        return "Error during summarization."

def create_overlapping_chunks(text, chunk_size, overlap_size):
    words = text.split()
    if len(words) <= chunk_size:
        return [" ".join(words)]
    chunks = []
    step = chunk_size - overlap_size
    for i in range(0, len(words), step):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks

# --- File Processors (from Member 1's logic) ---

def process_pdf(file_path):
    print("    > Extracting text and images from PDF...")
    full_text, images_data = "", []
    with pdfplumber.open(file_path) as pdf:
        full_text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    try:
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            for j, img in enumerate(page.get_images(full=True), start=1):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes, image_ext = base_image["image"], base_image["ext"]
                img_filename = f"{os.path.basename(file_path)}_p{i+1}_i{j}.{image_ext}"
                img_path = os.path.join(IMAGE_OUTPUT_DIR, img_filename)
                with open(img_path, "wb") as f: f.write(image_bytes)
                description = describe_image_with_gemini(img_path)
                images_data.append({"image_path": img_path, "description": description})
        doc.close()
    except Exception as e:
        print(f"      ! Could not process images for PDF: {e}")
    return full_text, images_data

def process_docx(file_path):
    print("    > Extracting text and images from DOCX...")
    doc = docx.Document(file_path)
    full_text = "\n".join([para.text for para in doc.paragraphs])
    images_data = []
    for i, rel in enumerate(doc.part.rels):
        if "image" in doc.part.rels[rel].target_ref:
            img_data = doc.part.rels[rel].target_part.blob
            img_ext = doc.part.rels[rel].target_ref.split('.')[-1]
            img_filename = f"{os.path.basename(file_path)}_i{i+1}.{img_ext}"
            img_path = os.path.join(IMAGE_OUTPUT_DIR, img_filename)
            with open(img_path, "wb") as f: f.write(img_data)
            description = describe_image_with_gemini(img_path)
            images_data.append({"image_path": img_path, "description": description})
    return full_text, images_data

# ... (process_pptx, process_xlsx, process_txt, process_csv are similar and can be added here)
def process_txt(file_path):
    print("    > Extracting text from TXT...")
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read(), []

# --- Main Knowledge Extraction Function (from Member 2's logic) ---

def extract_knowledge_triples(texts_to_process):
    print("    > Extracting knowledge triples...")
    all_triples = []
    for i, text_chunk in enumerate(texts_to_process, start=1):
        print(f"      > Processing text chunk {i}/{len(texts_to_process)}...")
        prompt_parts = [TRIPLE_EXTRACTION_PROMPT, "Text to analyze:", text_chunk]
        try:
            response = extraction_model.generate_content(prompt_parts)
            list_of_dicts = json.loads(response.text)
            print(f"        + Extracted {len(list_of_dicts)} triples.")
            all_triples.extend(list_of_dicts)
            time.sleep(API_DELAY_SECONDS)
        except Exception as e:
            print(f"        ! Error processing a text part: {e}")
    return all_triples


# --- Main Execution Pipeline ---
def main():
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)
    if SAVE_INTERMEDIATE_CHUNKS:
        os.makedirs(INTERMEDIATE_CHUNKS_DIR, exist_ok=True)
        
    file_types = ["*.pdf", "*.docx", "*.txt"] # Add other types as you implement them
    all_files = [file for ftype in file_types for file in glob.glob(ftype)]
    
    if not all_files:
        print("No files found to process. Please add supported files to this directory.")
        return

    print(f"Found {len(all_files)} file(s) to process.\n")
    
    final_knowledge_graph_data = []

    for file_path in all_files:
        print(f"--- 🎬 Processing File: {file_path} ---")
        full_text, images_data = "", []
        
        try:
            ext = os.path.splitext(file_path)[1].lower()
            if ext == ".pdf": full_text, images_data = process_pdf(file_path)
            elif ext == ".docx": full_text, images_data = process_docx(file_path)
            elif ext == ".txt": full_text, images_data = process_txt(file_path)
            # Add other elif blocks here for pptx, xlsx, etc.

            # 1. Clean the full text for processing
            cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
            
            # 2. Generate a summary of the document for context
            summary = summarize_text_with_gemini(cleaned_text) if cleaned_text else "No text content found to summarize."

            # 3. Combine full text and image descriptions for deep extraction
            all_content_text = cleaned_text
            for img in images_data:
                all_content_text += " " + img["description"]
            
            # 4. Chunk the combined content for the extraction model
            text_chunks = create_overlapping_chunks(all_content_text, CHUNK_SIZE, OVERLAP_SIZE)
            
            # **NEW**: Save intermediate chunks if enabled
            if SAVE_INTERMEDIATE_CHUNKS:
                chunk_filename = f"chunks_{os.path.basename(file_path)}.json"
                chunk_output_path = os.path.join(INTERMEDIATE_CHUNKS_DIR, chunk_filename)
                with open(chunk_output_path, "w", encoding="utf-8") as f:
                    json.dump(text_chunks, f, indent=4)
                print(f"    > Intermediate chunks saved to: {chunk_output_path}")

            # 5. Extract knowledge triples from the chunks
            extracted_triples = extract_knowledge_triples(text_chunks)
            
            # 6. Format the triples into the final numbered dictionary
            triples_dict = {str(i): triple for i, triple in enumerate(extracted_triples, 1)}

            # 7. Assemble the final JSON object for this file
            file_knowledge = {
                "source_file": os.path.basename(file_path),
                "episode_id": f"ep_{uuid.uuid4()}",
                "summary": summary,
                "triples": triples_dict
            }
            final_knowledge_graph_data.append(file_knowledge)
            print(f"--- ✅ Finished Processing: {file_path} ---\n")

        except Exception as e:
            print(f"--- ❌ FAILED to process {file_path}. Error: {e} ---\n")

    # Write the final consolidated results to a single JSON file
    output_filename = "knowledge_graph.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump({"knowledge_graph": final_knowledge_graph_data}, f, indent=4, ensure_ascii=False)

    print(f"--- 🎉 ALL DONE! --- \nKnowledge graph saved to '{output_filename}'")


if __name__ == "__main__":
    main()