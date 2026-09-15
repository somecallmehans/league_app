## Running the app for dummies

### Start uvicorn on port 8001
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload

### Start ngrok forwarding to port 8001
ngrok http 127.0.0.1:8001

The primary API uses port 8000.

### Analytics env (optional)

For Discord → GA4 Measurement Protocol (see `docs/analytics.md`):

- `GA_MEASUREMENT_ID`
- `GA_API_SECRET`
- `GA_USER_ID_SALT`

### Tests

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
PYTHONPATH=. pytest
```
