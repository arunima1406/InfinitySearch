# app/main.py
from fastapi import FastAPI, Request
import logging

app = FastAPI(title="RAG Response Receiver")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@app.post("/receive")
async def receive_rag_response(request: Request):
    raw_body = await request.body()
    print("Raw Body Received:", raw_body.decode())
    data = await request.json()
    print("Parsed JSON:", data)
    return {"status": "success", "received": data}
