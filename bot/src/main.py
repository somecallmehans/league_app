import os, json, httpx
import logging

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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


app = FastAPI()

SIGNATURE = "X-Signature-Ed25519"
TIMESTAMP = "X-Signature-Timestamp"

PROD_CHANNEL = os.getenv("PROD_CHANNEL")
DEV_CHANNEL = os.getenv("DEV_CHANNEL")

BOT_TOKEN = os.getenv("BOT_TOKEN")
DISCORD_API_URL = os.getenv("DISCORD_API")


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
            logger.info(f"Getting code for {user_id}")
            return await handle_getcode(user_id)

        if name == "link":
            data = payload.get("data") or {}
            options = data.get("options") or []
            q = ""
            if options and isinstance(options, list):
                first = options[0] or {}
                if isinstance(first, dict):
                    q = first.get("value") or ""

            logger.info(f"Handling linking for {user_id} with value {q}")
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


@app.get("/announcements")
async def announcements_health():
    return {"ok": True}


@app.post("/announcements")
async def announcements(req: Request):
    if req.headers.get("X-Api-Key") != BOT_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    data = await req.json()

    session_date = data.get("session_date", "an upcoming date")

    message = (
        f"**Commander League!**\n\n"
        f"Sign-ups for **{session_date}** are now open!\n"
        f"Sign in by typing `/signin` in this channel\n"
        f"You can also sign in on our website using your unique code: https://commanderleague.xyz/pods\n\n"
        f"If you haven't linked your discord yet, run /link first and then signin.\n\n"
        f"If you have any questions, please contact a league admin."
    )

    headers = {
        "Authorization": f"Bot {BOT_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{DISCORD_API_URL}/channels/{PROD_CHANNEL}/messages",
                json={"content": message},
                headers=headers,
            )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to post to Discord: {str(e)}"
        )


@app.post("/test_message")
async def send_test_message():
    """Sends a simple test message to your configured Discord channel."""
    if not all([BOT_TOKEN, PROD_CHANNEL]):
        raise HTTPException(status_code=500, detail="Missing bot token or channel ID")

    headers = {
        "Authorization": f"Bot {BOT_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "content": "Test - Please disregard!",
        "allowed_mentions": {"parse": []},
    }

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(
                f"{DISCORD_API_URL}/channels/{PROD_CHANNEL}/messages",
                json=payload,
                headers=headers,
            )
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Discord API error: {e.response.text}",
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"HTTP request failed: {e}")

    data = r.json()
    return {
        "message_id": data.get("id"),
        "channel_id": data.get("channel_id"),
        "status": "sent",
    }
