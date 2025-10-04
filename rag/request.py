import requests

url = "http://127.0.0.1:8000/chat"

payload = {
    "query": "what is react native?",
    "top_k": 5,
    "min_score": 0.8
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    print("Response JSON:")
    print(response.json())
else:
    print(f"Error {response.status_code}: {response.text}")


# uvicorn app:app --reload --port 8000

# uvicorn app:app --reload --host 0.0.0.0 --port 8000

