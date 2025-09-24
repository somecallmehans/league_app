import os, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=False)

from fastapi import FastAPI, Request, HTTPException
from .verify import verify_signature
from .router import handle_getcode, handle_link, handle_link_autocomplete
from .constants import PING, APP_COMMAND, APP_COMMAND_AUTOCOMPLETE


app = FastAPI()

SIGNATURE = "X-Signature-Ed25519"
TIMESTAMP = "X-Signature-Timestamp"


@app.post("/interactions")
async def interactions(req: Request):
    sig = req.headers.get(SIGNATURE)
    ts = req.headers.get(TIMESTAMP)
    body = await req.body()

    if not sig or not ts or not verify_signature(sig, ts, body):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)
    t = payload["type"]

    if t == PING:
        return {"type": 1}

    if t == APP_COMMAND_AUTOCOMPLETE:
        q = payload["data"]["options"][0].get("value", "")
        return await handle_link_autocomplete(q)

    if t == APP_COMMAND:
        name = payload["data"]["name"]
        user = (payload.get("member") or {}).get("user") or payload.get("user")
        user_id = int(user["id"])

        if name == "mycode":
            return await handle_getcode(user_id)

        if name == "link":
            option = payload["data"]["options"][0]
            return await handle_link(user_id, option["value"])

    return {
        "type": 4,
        "data": {"flags": 64, "content": "Sorry, I don't know that command."},
    }
