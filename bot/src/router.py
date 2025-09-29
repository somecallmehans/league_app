import os, httpx, time
from datetime import datetime

API_BASE = os.getenv("LEAGUE_API_BASE")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN")

EPHEMERAL = 64
SELECTIONS = {}
TTL = 15 * 60


async def get_code(discord_user_id: int):
    async with httpx.AsyncClient(timeout=10) as http:
        url = f"{API_BASE}api/discord/mycode/{discord_user_id}/"
        res = await http.get(
            url, headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"}
        )
        if res.status_code == 200:
            return res.json()

    return None


async def handle_getcode(user_id: int):
    data = await get_code(user_id)
    if not data:
        return {
            "type": 4,
            "data": {
                "flags": EPHEMERAL,
                "content": "This Discord account isn’t linked yet. Run `/linkme` to link.",
            },
        }
    return {
        "type": 4,
        "data": {
            "flags": EPHEMERAL,
            "content": f"Your sign-in code: **{data['code']}**",
        },
    }


async def search_unlinked(query: str):
    if not query:
        return []
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            f"{API_BASE}api/discord/search/{query}/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
        )
        return r.json() if r.status_code == 200 else []


async def handle_link_autocomplete(query: str):
    res = await search_unlinked(query)
    choices = [
        {
            "name": r["name"],
            "value": f"{r['name']}:{r['id']}",
        }
        for r in res[:10]
    ]
    return {"type": 8, "data": {"choices": choices}}


async def link(discord_user_id: int, participant_id: int):
    url = f"{API_BASE}api/discord/link/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"discord_user_id": discord_user_id, "participant_id": participant_id},
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
        )
        return res


async def handle_link(user_id: int, participant_value: str):
    val = participant_value.split(":")
    name = val[0]
    pid = int(val[1])
    res = await link(user_id, pid)
    if res.status_code == 201:
        code = res.json()["code"]
        msg = f"Successfully linked **{name}** to your Discord account. Your login code is **{code}**, and you can access it any time with the /mycode command in this channel."
    else:
        msg = "Could not link accounts, please contact a league admin."

    return {"type": 4, "data": {"flags": EPHEMERAL, "content": msg}}


def _ephemeral(text: str):
    return {"type": 4, "data": {"flags": 64, "content": text}}


def _get_selection(guild_id, user_id):
    item = SELECTIONS.get((guild_id, user_id))
    if not item:
        return None
    exp, vals = item
    if exp < time.time():
        SELECTIONS.pop((guild_id, user_id), None)
        return None
    return vals


def _cache_selection(guild_id, user_id, round_ids):
    SELECTIONS[(guild_id, user_id)] = (time.time() + TTL, round_ids)


async def handle_signin(user, uid, guild_id):
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            f"{API_BASE}api/discord/next_session/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
        )
        if r.status_code != 200:
            return _ephemeral("Couldn't find an upcoming session.")

        data = r.json()

    rounds = data.get("rounds", [])[:2]  # expect 2
    if not rounds:
        return _ephemeral("No rounds available yet.")

    _cache_selection(guild_id, uid, [])

    formatted_date = datetime.strptime(data.get("session_date"), "%Y-%m-%d").strftime(
        "%m/%d/%Y"
    )

    return {
        "type": 4,
        "data": {
            "flags": 64,
            "content": f"Select round(s) for **{formatted_date}**",
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 3,
                            "custom_id": "signin_select",
                            "min_values": 1,
                            "max_values": 2,
                            "placeholder": "Choose 1 or 2 rounds",
                            "options": [
                                {
                                    "label": f"Round {r['round_number']}",
                                    "value": str(r["id"]),  # must be string
                                    "description": (
                                        datetime.strptime(
                                            r["starts_at"], "%Y-%m-%dT%H:%M:%SZ"
                                        ).strftime("%-I:%M %m/%d/%Y")
                                        if r.get("starts_at")
                                        else ""
                                    ),
                                }
                                for r in rounds
                            ],
                        }
                    ],
                },
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 1,
                            "label": "Confirm",
                            "custom_id": "signin_confirm",
                        }
                    ],
                },
            ],
        },
    }


async def handle_signin_select(uid, guild_id, values):

    _cache_selection(guild_id, uid, values)

    # ACK with an update (no visible change required). Use a small hint.
    return {
        "type": 7,  # UPDATE_MESSAGE
        "data": {
            "flags": 64,
            "content": f"Selected {len(values)} round(s). Click **Confirm** to sign in.",
        },
    }


async def handle_signin_confirm(uid, guild_id):

    sel = _get_selection(guild_id, uid) or []
    if not sel:
        return _ephemeral("Please choose at least one round first.")

    round_ids = [int(x) for x in sel]

    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            f"{API_BASE}api/discord/signin/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
            json={"discord_user_id": uid, "rounds": round_ids},
        )
    if r.status_code == 201 or r.status_code == 200:
        # Success → edit ephemeral response
        return {
            "type": 7,
            "data": {
                "flags": 64,
                "content": f"✅ Signed in for rounds: {', '.join(sel)}",
                "components": [],
            },
        }

    # Handle common errors from your API
    msg = "Something went wrong."
    try:
        msg = r.json().get("message") or msg
    except Exception:
        pass
    return _ephemeral(f"❌ {msg}")
