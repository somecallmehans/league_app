import os, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=False)

from fastapi import FastAPI, Request, HTTPException
from .verify import verify_signature
from .router import (
    handle_getcode,
    handle_link,
    handle_link_autocomplete,
    handle_signin,
    handle_signin_confirm,
    handle_signin_select,
)
from .constants import PING, APP_COMMAND, APP_COMMAND_AUTOCOMPLETE, MESSAGE


app = FastAPI()

SIGNATURE = "X-Signature-Ed25519"
TIMESTAMP = "X-Signature-Timestamp"

PROD_CHANNEL = os.getenv("PROD_CHANNEL")
DEV_CHANNEL = os.getenv("DEV_CHANNEL")


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

    channel = payload.get("channel") or {}
    channel_id = channel.get("id")

    if channel_id not in (PROD_CHANNEL, DEV_CHANNEL):
        return {
            "type": 4,
            "data": {
                "flags": 64,
                "content": "This command only works in #mtg-commander-league",
            },
        }

    if t == APP_COMMAND_AUTOCOMPLETE:
        data = payload.get("data") or {}
        options = data.get("options") or []
        q = ""
        if options and isinstance(options, list):
            first = options[0] or {}
            if isinstance(first, dict):
                q = first.get("value") or ""
        return await handle_link_autocomplete(q)

    if t == APP_COMMAND:
        data = payload.get("data") or {}
        name = data.get("name") or ""

        user = (payload.get("member") or {}).get("user") or payload.get("user")
        user_id = int(user["id"])
        guild_id = payload.get("guild_id")

        if name == "mycode":
            return await handle_getcode(user_id)

        if name == "link":
            data = payload.get("data") or {}
            options = data.get("options") or []
            q = ""
            if options and isinstance(options, list):
                first = options[0] or {}
                if isinstance(first, dict):
                    q = first.get("value") or ""

            return await handle_link(user_id, q)

        if name == "signin":
            return await handle_signin(user_id, guild_id)

    if t == MESSAGE:
        data = payload.get("data") or {}
        cid = data.get("custom_id")

        user = (payload.get("member") or {}).get("user") or payload.get("user")
        uid = int(user["id"])
        guild_id = payload.get("guild_id")

        if cid == "signin_select":
            values = data.get("values", [])
            return await handle_signin_select(uid, guild_id, values)

        if cid == "signin_confirm":
            return await handle_signin_confirm(uid, guild_id)

    return {
        "type": 4,
        "data": {"flags": 64, "content": "Sorry, I don't know that command."},
    }
