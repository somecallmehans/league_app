import os, httpx, time

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


def _cache_selection(guild_id, user_id, round_ids) -> None:
    SELECTIONS[(guild_id, user_id)] = (time.time() + TTL, round_ids)


async def handle_signin(uid, guild_id):
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            f"{API_BASE}api/discord/next_session/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
        )
        if r.status_code != 200:
            return _ephemeral("Couldn't find an upcoming session.")

        data = r.json()

    rounds = [r for r in (data.get("rounds") or [])[:2] if not r.get("is_full")]
    if not rounds:
        return _ephemeral("Unfortunately, both rounds are full.")

    _cache_selection(guild_id, uid, [])

    formatted_date = data.get("session_date")

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
                            "max_values": min(2, len(rounds)),
                            "placeholder": f"Choose up to {len(rounds)} round(s)",
                            "options": [
                                {
                                    "label": f"Round {r['round_number']}",
                                    "value": str(r["id"]),
                                    "description": f"{r['current_count']} of {r['cap']} spots claimed",
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


def _determine_round_number(rids: int) -> str:
    rounds = []
    for rid in rids:
        if rid % 2 == 0:
            rounds.append("Round 2")
        else:
            rounds.append("Round 1")

    return ", ".join(rounds)


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
        return {
            "type": 7,
            "data": {
                "flags": 64,
                "content": f"✅ Signed in for: {_determine_round_number(round_ids)}",
                "components": [],
            },
        }

    msg = "Something went wrong."
    try:
        msg = r.json().get("message") or msg
    except Exception:
        pass
    return _ephemeral(f"❌ {msg}")


async def handle_drop(uid):
    """Handle dropping a participant from their league rounds."""

    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            f"{API_BASE}api/discord/drop/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
            json={"discord_user_id": uid},
        )

    res = r.json()
    date = res.get("date")
    if r.status_code == 202:
        return {
            "type": 4,
            "data": {
                "flags": 64,
                "content": f"You have been dropped from league on {date}",
                "components": [],
            },
        }

    msg = "Something went wrong."
    try:
        msg = res.get("message") or msg
    except Exception:
        pass
    return _ephemeral(f"❌ {msg}")


async def handle_edit_decklist_url(uid):
    """Handle issuing a URL for users to edit their stored decklists."""

    async with httpx.AsyncClient(timeout=10) as http:
        resp = await http.post(
            f"{API_BASE}api/discord/issue_token/",
            headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"},
            json={"discord_user_id": uid},
        )
    try:
        res = resp.json()
    except ValueError:
        res = {}

    if resp.status_code == 400:
        msg = res.get("message", "Something went wrong.")
        return {
            "type": 4,
            "data": {
                "flags": EPHEMERAL,
                "content": msg,
            },
        }

    if resp.status_code == 201:
        return {
            "type": 4,
            "data": {
                "flags": EPHEMERAL,
                "content": (
                    f"Your edit code: **{res['code']}**\n\n"
                    "[Click here to edit your decklists]"
                    "(https://commanderleague.xyz/decklists/gatekeeper)\n\n"
                    "You can use this code for the next 30 minutes."
                ),
            },
        }

    return {
        "type": 4,
        "data": {
            "flags": EPHEMERAL,
            "content": "Something went wrong.",
        },
    }
