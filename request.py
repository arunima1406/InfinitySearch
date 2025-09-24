import requests

resp = requests.post(
    "http://127.0.0.1:8000/chat",
    json={"query": "How is alice related to bob?"}
)
print(resp.json())


# uvicorn app:app --reload --port 8000
