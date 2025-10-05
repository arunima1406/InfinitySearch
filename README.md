# InfinitySearch

Made for Samsung Prism GenAI Hackathon

## Overview

InfinitySearch is a knowledge graph ingestion and retrieval system that processes episode-based knowledge graphs, generates semantic embeddings, and stores them in a Neo4j graph database for efficient similarity search. The system integrates with AWS S3 for data storage and Google Gemini for embedding generation.

## What Was Done

### Core Functionality
- **Knowledge Graph Ingestion**: Processes JSON files containing knowledge graphs with triples (subject-predicate-object relationships) from episodes.
- **Embedding Generation**: Uses Google Gemini's text-embedding-004 model to generate 768-dimensional embeddings for episode summaries.
- **Graph Database Storage**: Stores entities, relationships, and episodes in Neo4j with user-specific isolation.
- **Vector Search**: Creates a vector index in Neo4j for cosine similarity search on episode embeddings.
- **Multi-User Support**: All data is tagged with user IDs for multi-tenant functionality.

### Data Flow
1. JSON files are retrieved from AWS S3 bucket under the `kg-json/` prefix.
2. Each file contains a knowledge graph with episodes and their associated triples.
3. Episode summaries are embedded using Gemini API.
4. Triples are inserted into Neo4j as nodes (Entities) and relationships.
5. Episodes are stored as separate nodes with embeddings for vector search.

## Technologies Used

### Core Technologies
- **Python 3.x**: Main programming language
- **Neo4j 5.12**: Graph database for storing knowledge graphs and vector embeddings
- **AWS S3**: Cloud storage for JSON knowledge graph files
- **Google Gemini**: AI model for generating text embeddings (text-embedding-004)
- **Docker & Docker Compose**: Containerization for Neo4j database

### Python Libraries
- `neo4j`: Official Neo4j Python driver
- `boto3`: AWS SDK for Python (S3 operations)
- `google-generativeai`: Google Gemini API client
- `python-dotenv`: Environment variable management
- `uuid`: Unique identifier generation
- `json`: JSON parsing
- `re`: Regular expressions for relationship sanitization
- `typing`: Type hints

## How It Was Done

### Architecture
The system follows a modular architecture with clear separation of concerns:

1. **Configuration Management**: Environment variables loaded from `.env` file
2. **S3 Integration**: Functions to list and download JSON files from S3
3. **Embedding Service**: Gemini API integration for text-to-vector conversion
4. **Database Operations**: Neo4j transactions for data insertion and index creation
5. **Data Processing**: JSON parsing and triple extraction logic

### Key Implementation Details

#### Embedding Strategy
- Embeddings are generated once per episode (not per triple) to optimize API calls
- Uses cosine similarity for vector search in Neo4j
- 768-dimensional vectors stored in the database

#### Graph Schema
- **Entity Nodes**: Represent subjects and objects with `name` and `user_id` properties
- **Relationship Edges**: Dynamic relationship types based on triple predicates (sanitized to uppercase)
- **Episode Nodes**: Store metadata, summaries, and embeddings with `id`, `user_id`, `source_file`, `summary`, and `embedding` properties
- **Mentions Relationships**: Connect episodes to mentioned entities

#### Vector Index
- Uses Neo4j 5.x vector index syntax
- Configured for 768 dimensions with cosine similarity
- Enables efficient k-nearest neighbor searches

### Data Processing Pipeline
1. List all JSON files for a user from S3
2. Download and parse each JSON file
3. Extract knowledge graph items (episodes)
4. Generate embeddings for episode summaries
5. Process triples within each episode
6. Insert data into Neo4j with user isolation
7. Create vector index if it doesn't exist

## How to Run

### Prerequisites
- Python 3.8+
- Docker and Docker Compose
- AWS account with S3 access
- Google Gemini API key

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd InfinitySearch
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install neo4j boto3 google-generativeai python-dotenv
   ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```env
   # Neo4j Configuration
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=Neo4jPass123

   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   S3_BUCKET=your-s3-bucket-name

   # Gemini Configuration
   GEMINI_API_KEY=your-gemini-api-key
   ```

### Running Neo4j Database

1. **Navigate to Neo4j Docker directory**:
   ```bash
   cd neo4j-docker
   ```

2. **Start Neo4j container**:
   ```bash
   docker-compose up -d
   ```

3. **Verify Neo4j is running**:
   - Open browser at `http://localhost:7474`
   - Login with `neo4j` / `Neo4jPass123`

### Data Ingestion

1. **Prepare your data**:
   - Upload JSON files to your S3 bucket under the `kg-json/` prefix
   - Each JSON file should have this structure:
   ```json
   {
     "knowledge_graph": [
       {
         "source_file": "episode1.txt",
         "episode_id": "ep001",
         "summary": "Episode summary text...",
         "triples": {
           "triple1": {
             "start": "Entity A",
             "relation": "RELATES_TO",
             "end": "Entity B"
           }
         }
       }
     ]
   }
   ```

2. **Run the ingestion script**:
   ```bash
   python kg_auth_s3_vector_dup.py
   ```

### Monitoring and Verification

- Check Neo4j Browser for graph visualization
- Query vector index: `CALL db.index.vector.queryNodes('episode_index', 10, [0.1, 0.2, ...])`
- Monitor logs for successful insertions and any errors

### Stopping the System

1. **Stop Neo4j container**:
   ```bash
   cd neo4j-docker
   docker-compose down
   ```

2. **Deactivate virtual environment**:
   ```bash
   deactivate
   ```

## File Structure

```
InfinitySearch/
├── kg_auth_s3_vector_dup.py    # Main ingestion script
├── neo4j-docker/
│   └── docker-compose.yml      # Neo4j container configuration
├── .env                        # Environment variables (create this)
├── .gitignore                  # Git ignore patterns
└── README.md                   # This file
```

## Troubleshooting

### Common Issues
- **Neo4j Connection Failed**: Ensure Docker container is running and ports are available
- **S3 Access Denied**: Verify AWS credentials and bucket permissions
- **Gemini API Error**: Check API key validity and quota limits
- **Vector Index Creation Failed**: Ensure Neo4j version supports vector indexes (5.x+)

### Logs and Debugging
- Enable verbose logging by modifying print statements in the script
- Check Neo4j logs: `docker logs neo4j`
- Verify S3 connectivity with AWS CLI: `aws s3 ls s3://your-bucket/`

## Future Enhancements

- Implement RAG (Retrieval-Augmented Generation) queries
- Add support for multiple embedding models
- Implement batch processing for large datasets
- Add API endpoints for real-time ingestion
- Enhance error handling and retry mechanisms
