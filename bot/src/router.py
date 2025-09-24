import os
import httpx


API_BASE = os.getenv("LEAGUE_API_BASE")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN")

EPHEMERAL = 64


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
