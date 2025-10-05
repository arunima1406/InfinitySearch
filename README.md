# InfinitySearch
![Project Icon](main/Group4.png)

Made for Samsung Prism GenAI Hackathon

## Project Overview

InfinitySearch is an AI-powered **semantic search** application designed to process documents, extract meaningful knowledge, and enable intelligent querying through a mobile interface. The project leverages Generative AI (Gemini) to build **knowledge graphs using Neo4j** from various document types, allowing users to perform semantic searches beyond simple keyword matching.

The application consists of multiple components:
- **Document Processing Pipeline**: Extracts text and images from PDFs, DOCX, TXT, and other formats, summarizes content, and extracts knowledge triples using AI.
- **Knowledge Graph Construction**: Builds structured knowledge representations from extracted triples.
- **Mobile Search App**: A React Native (Expo) application for intuitive semantic search through processed documents.

## Key Features

- **Multi-format Document Support**: Processes PDF, DOCX, TXT, and potentially other formats.
- **AI-Powered Extraction**: Uses Google Gemini AI for text summarization, image description, and knowledge triple extraction.
- **Knowledge Graph Generation**: Creates structured representations of document content for advanced querying.
- **Semantic Search**: Enables natural language queries that understand context and relationships.
- **Mobile-First Design**: Cross-platform mobile app built with React Native and Expo.
- **Modular Architecture**: Separate branches for different components allowing parallel development.

## Branches

The project is organized across multiple branches for different components:

- `main`: Main branch with project overview and README
- `KG`: Knowledge Graph construction and management
- `app-be`: Backend API services
- `app-frontend`: Mobile application frontend
- `chunker`: Document chunking algorithms
- `chunking+ner`: Combined chunking and Named Entity Recognition
- `ner`: Named Entity Recognition components
- `rag`: Retrieval-Augmented Generation for enhanced search

Please checkout the relevant branches for specific components.

## Technology Stack

### AI/ML Components
- Python 3.11
- Google Generative AI (Gemini)
- Libraries: pdfplumber, PyMuPDF, python-docx, Pillow, openpyxl, python-pptx

### Mobile Application
- React Native
- Expo
- TypeScript

## Setup and Installation

### Prerequisites
- Node.js (for mobile app)
- Python 3.11 (for AI processing)
- Google AI API Key (for Gemini)
- Expo CLI (for mobile development)

### Mobile App Setup
1. Navigate to the project root
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   # or
   expo start
   ```
4. For specific platforms:
   ```bash
   expo run:android  # for Android only
   ```

### Processing Documents
1. Place documents (PDF, DOCX, TXT) in the project directory
2. Run the processing script:
   ```bash
   python combining/chunker_ner.py
   ```
3. The script will:
   - Extract text and images
   - Generate summaries
   - Extract knowledge triples
   - Create a `knowledge_graph.json` file

### Using the Mobile App
1. Start the Expo development server
2. Scan the QR code with Expo Go app or run on emulator
3. Upload or select documents for processing
4. Perform semantic searches through the processed knowledge

## API Endpoints

The backend provides RESTful APIs for:
- Document upload and processing
- Knowledge graph queries
- Search operations
- File management


## Submissions

### Resources
- [Project Repository](https://github.com/arunima1406/InfinitySearch)
- [Demo Video + PPT](https://drive.google.com/drive/folders/16VGhchOzv8j8aJ3kQqDY9-tqthJA45E5?usp=sharing)

## License

This project is developed for the Samsung Prism GenAI Hackathon. Please refer to the hackathon guidelines for licensing and usage rights.

## Contact

For questions or collaboration opportunities, please reach out through the project repository.
