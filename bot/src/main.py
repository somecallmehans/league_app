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
    handle_participant_autocomplete,
    handle_signin,
    handle_signin_confirm,
    handle_signin_select,
    handle_drop,
    handle_edit_decklist_url,
    handle_join,
    handle_join_name_submit,
    handle_join_link_existing,
    handle_join_confirm,
    handle_updatename,
    handle_updatename_submit,
    validate_channel,
)
from .helpers import (
    get_modal_value,
    ephemeral,
    looks_like_selection,
    parse_join_confirm,
    join_name_modal,
)
from .constants import (
    PING,
    APP_COMMAND,
    APP_COMMAND_AUTOCOMPLETE,
    MESSAGE,
    MODAL_SUBMIT,
)

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
    guild_id = payload.get("guild_id")
    data = payload.get("data") or {}
    name = data.get("name")

    if not guild_id or not channel_id:
        return {
            "type": 4,
            "data": {
                "flags": 64,
                "content": "This command must be used in a server channel.",
            },
        }

    ok = await validate_channel(guild_id, channel_id)
    if not ok:
        return {
            "type": 4,
            "data": {
                "flags": 64,
                "content": "This command does not work in this channel",
            },
        }

    if t == APP_COMMAND_AUTOCOMPLETE:
        options = data.get("options") or []
        q = ""
        if options and isinstance(options, list):
            first = options[0] or {}
            if isinstance(first, dict):
                q = first.get("value") or ""
        if name in ("link", "join"):
            return await handle_participant_autocomplete(q, guild_id)

    if t == APP_COMMAND:
        user = (payload.get("member") or {}).get("user") or payload.get("user")
        user_id = int(user["id"])

        if name == "mycode":
            logger.info(f"Getting code for {user_id} at guild {guild_id}")
            return await handle_getcode(user_id, guild_id)

        if name == "link":
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

        if name == "join":
            options = data.get("options") or []
            user_id = int(payload["member"]["user"]["id"])

            participant_value = ""
            if options and isinstance(options, list):
                first = options[0] or {}
                if isinstance(first, dict):
                    participant_value = first.get("value") or ""

            return await handle_join(user_id, participant_value, guild_id)

        if name == "updatename":
            return await handle_updatename(user_id, guild_id)

    if t == MESSAGE:
        cid = data.get("custom_id")

        user = (payload.get("member") or {}).get("user") or payload.get("user")
        uid = int(user["id"])

        if cid == "signin_select":
            values = data.get("values", [])
            return await handle_signin_select(uid, guild_id, values)

        if cid == "signin_confirm":
            return await handle_signin_confirm(uid, guild_id)

        if cid == "join:pick":
            values = data.get("values", []) or []
            if not values:
                return ephemeral(
                    "Please select a name from the list, or choose “I'm new”."
                )
            first = values[0]
            if not looks_like_selection(first):
                return ephemeral("That selection didn’t look right. Try /join again.")
            return await handle_join_link_existing(uid, first, guild_id)

        pid = parse_join_confirm(cid)
        if pid is not None:
            return await handle_join_confirm(uid, pid, guild_id)

        if cid == "join:new":
            return join_name_modal()

    if t == MODAL_SUBMIT:
        cid = data.get("custom_id")

        if cid == "join:name":
            user = (payload.get("member") or {}).get("user") or payload.get("user")
            user_id = int(user["id"])
            entered_name = get_modal_value(data, "name")
            return await handle_join_name_submit(user_id, entered_name, guild_id)

        if cid == "updatename:submit":
            user = (payload.get("member") or {}).get("user") or payload.get("user")
            user_id = int(user["id"])
            return await handle_updatename_submit(user_id, guild_id, data)

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
    channel_id = data.get("channel_id")
    if not slug or not channel_id:
        raise HTTPException(
            status_code=400, detail="Missing slug or channel in payload"
        )

    url = f"{slug}.commanderleague.xyz/pods"

    message = (
        f"@here\n"
        f"**Commander League!**\n\n"
        f"Sign-ups for **{session_date}** are now open!\n\n"
        f"**New here (or new to this store)?**\n"
        f"If you’ve never participated in the league, never registered via Discord, or haven’t played at this store before, run `/join` first.\n\n"
        f"You will only have to run /join once at this store.\n\n"
        f"**Register for this round:**\n"
        f"- Run `/signin` in this channel to sign up.\n"
        f"- Or use your unique code from `/mycode` to sign in on our website:\n\n"
        f"   https://" + url + "\n\n"
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
                f"{DISCORD_API_URL}/channels/{channel_id}/messages",
                json={"content": message},
                headers=headers,
            )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to post to Discord: {str(e)}"
        )
