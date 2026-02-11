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
    handle_drop,
    handle_edit_decklist_url,
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

CHANNEL_ID = os.getenv("CHANNEL_ID")

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

    if channel_id not in (CHANNEL_ID):
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
        guild_id = payload.get("guild_id")
        q = ""
        if options and isinstance(options, list):
            first = options[0] or {}
            if isinstance(first, dict):
                q = first.get("value") or ""
        return await handle_link_autocomplete(q, guild_id)

    if t == APP_COMMAND:
        data = payload.get("data") or {}
        name = data.get("name") or ""

        user = (payload.get("member") or {}).get("user") or payload.get("user")
        user_id = int(user["id"])
        guild_id = payload.get("guild_id")

        if name == "mycode":
            logger.info(f"Getting code for {user_id} at guild {guild_id}")
            return await handle_getcode(user_id, guild_id)

        if name == "link":
            data = payload.get("data") or {}
            options = data.get("options") or []
            q = ""
            if options and isinstance(options, list):
                first = options[0] or {}
                if isinstance(first, dict):
                    q = first.get("value") or ""

            logger.info(f"Handling linking for {user_id} with value {q}")
            return await handle_link(user_id, q, guild_id)

        if name == "signin":
            logger.info(f"Attempting sign in for {user_id}")
            return await handle_signin(user_id, guild_id)

        if name == "drop":
            return await handle_drop(user_id, guild_id)

        if name == "editdecklist":
            logger.info(f"Attempting edit decklist request for {user_id}")
            return await handle_edit_decklist_url(user_id, guild_id)

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

    session_date = data.get("session_date", "the next round of league")
    slug = data.get("slug")
    url = f"{slug}.commanderleague.xyz/pods"

    message = (
        f"**Commander League!**\n\n"
        f"Sign-ups for **{session_date}** are now open!\n\n"
        f"**How to Sign Up:**\n"
        f"- Type `/signin` in this channel to register for the new round.\n"
        f"- Or sign in on our website using your unique code: \n\n"
        f"   https://" + url + "\n\n"
        f"**Never Signed In With Discord?**\n"
        f"If you haven’t linked your Discord account yet, run `/link` first, then use `/signin` to register.\n\n"
        f"**New to Commander League?**\n"
        f"If you haven't participated in Commander League before, post in the channel or reach out to a league admin to get added to the league database.\n"
        f"Once added, you will be able to use the above commands to sign in.\n\n"
        f"**Need to drop out?**\n"
        f"Run `/drop` at any time to remove yourself from this round.\n\n"
        f"💬 **Questions?**\n"
        f"Contact a league admin for help."
    )

    headers = {
        "Authorization": f"Bot {BOT_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{DISCORD_API_URL}/channels/{CHANNEL_ID}/messages",
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
    if not all([BOT_TOKEN, CHANNEL_ID]):
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
                f"{DISCORD_API_URL}/channels/{CHANNEL_ID}/messages",
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
