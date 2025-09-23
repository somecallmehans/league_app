import os, json
from fastapi import FastAPI, Request, HTTPException
from .verify import verify_signature

app = FastAPI()

SIGNATURE = "X-Signature-Ed25519"
TIMESTAMP = "X-Signature-Timestamp"

# Interaction data map
PING = 1
APP_COMMAND = 2
MESSAGE = 3
APP_COMMAND_AUTOCOMPLETE = 4
MODAL_SUBMIT = 5


@app.get("/interactions")
async def interactions(req: Request):
    sig = req.headers.get(SIGNATURE)
    ts = req.headers.get(TIMESTAMP)
    body = await req.body()
    print(os.getenv("DISCORD_PUBLIC_KEY"))

    if not sig or not ts or not verify_signature(sig, ts, body):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)
    t = payload["type"]

    if t == PING:
        return {"type": 1}
