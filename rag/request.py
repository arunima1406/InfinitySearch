import requests

resp = requests.post(
    "http://127.0.0.1:8000/user-query",
    json={
        "user_id": "user_33cIGrBMt6QOqReLMXYVi7p6nFi",
        "query": "Explain the waterfall model"
    }
)

print("Status:", resp.status_code)
print("Response:", resp.json())



# uvicorn app:app --reload --port 8000

# uvicorn app:app --reload --host 0.0.0.0 --port 8000

