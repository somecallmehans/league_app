## Running the app for dummies

### Start uvicorn on port 8001
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload

### Start ngrok forwarding to port 8001
ngrok http 127.0.0.1:8001

The primary API uses port 8000.