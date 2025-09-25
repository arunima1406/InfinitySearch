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
IMAGE_OUTPUT_DIR = "extracted_images"
MAX_TEXT_LENGTH_FOR_SUMMARY = 200000
QUICK_TASK_MODEL = 'gemini-2.5-flash-lite'
EXTRACTION_MODEL = 'gemini-2.5-flash-lite' # Changed to 1.5 for larger context
API_DELAY_SECONDS = 3
# ---------------------

# --- Setup ---
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("API key not found. Please set GOOGLE_API_KEY in your .env file.")
genai.configure(api_key=api_key)

# --- Gemini Models and Prompts ---
quick_model = genai.GenerativeModel(QUICK_TASK_MODEL)
extraction_model = genai.GenerativeModel(
    EXTRACTION_MODEL,
    generation_config={"response_mime_type": "application/json"}
)
TRIPLE_EXTRACTION_PROMPT = """
You are an expert information extraction agent. Your task is to analyze the user's text and extract knowledge triples.

Output ONLY a valid JSON array of objects. Each object represents a single relationship and must have three keys: "start", "relation", and "end".

- The "relation" value must be descriptive, uppercase, and snake_case (e.g., PROPOSED, IS_A).
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

# --- Helper Functions ---
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

# --- File Processors (Unchanged) ---
def process_pdf(file_path):
    print("    > Extracting text and images from PDF...")
    full_text, images_data = "", []
    with pdfplumber.open(file_path) as pdf:
        full_text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
    try:
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            for j, img in enumerate(page.get_images(full=True), start=1):
                xref, base_image = img[0], doc.extract_image(img[0])
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
            img_data, img_ext = doc.part.rels[rel].target_part.blob, doc.part.rels[rel].target_ref.split('.')[-1]
            img_filename = f"{os.path.basename(file_path)}_i{i+1}.{img_ext}"
            img_path = os.path.join(IMAGE_OUTPUT_DIR, img_filename)
            with open(img_path, "wb") as f: f.write(img_data)
            description = describe_image_with_gemini(img_path)
            images_data.append({"image_path": img_path, "description": description})
    return full_text, images_data
    
def process_txt(file_path):
    print("    > Extracting text from TXT...")
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read(), []

# --- MODIFIED Knowledge Extraction Function ---
def extract_knowledge_triples(full_text):
    print("    > Extracting knowledge triples from full text...")
    if not full_text.strip():
        print("      ! No text content to extract triples from.")
        return []

    prompt_parts = [TRIPLE_EXTRACTION_PROMPT, "Text to analyze:", full_text]
    try:
        response = extraction_model.generate_content(prompt_parts)
        list_of_dicts = json.loads(response.text)
        print(f"      + Extracted {len(list_of_dicts)} triples from the document.")
        time.sleep(API_DELAY_SECONDS)
        return list_of_dicts
    except Exception as e:
        print(f"      ! Error processing the full text for triples: {e}")
        return []

# --- Main Execution Pipeline ---
def main():
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)
    file_types = ["*.pdf", "*.docx", "*.txt"]
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

            cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
            summary = summarize_text_with_gemini(cleaned_text) if cleaned_text else "No text to summarize."

            # Combine text and image descriptions for a complete context
            all_content_text = cleaned_text
            for img in images_data:
                all_content_text += " " + img["description"]
            
            # **MODIFIED**: Extract triples from the entire combined content at once
            extracted_triples = extract_knowledge_triples(all_content_text)
            
            # **NEW**: Post-processing to remove duplicates
            unique_triples_list = []
            seen_triples = set()
            for triple in extracted_triples:
                # Create a canonical representation for checking duplicates
                canonical_triple = (
                    triple.get('start', '').strip().lower(),
                    triple.get('relation', '').strip().lower(),
                    triple.get('end', '').strip().lower()
                )
                if all(canonical_triple) and canonical_triple not in seen_triples:
                    seen_triples.add(canonical_triple)
                    unique_triples_list.append(triple)

            print(f"    > Found {len(unique_triples_list)} unique triples after de-duplication.")

            triples_dict = {str(i): triple for i, triple in enumerate(unique_triples_list, 1)}

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

    output_filename = "knowledge_graph1.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump({"knowledge_graph": final_knowledge_graph_data}, f, indent=4, ensure_ascii=False)
    print(f"--- 🎉 ALL DONE! --- \nKnowledge graph saved to '{output_filename}'")

if __name__ == "__main__":
    main()