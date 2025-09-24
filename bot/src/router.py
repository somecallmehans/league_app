import os
import httpx


API_BASE = os.getenv("LEAGUE_API_BASE")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN")

EPHEMERAL = 64


async def get_code(discord_user_id: int):
    async with httpx.AsyncClient(timeout=10) as http:
        url = f"{API_BASE}api/discord/mycode/{discord_user_id}/"
        print(url)
        res = await http.get(url, headers={"Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}"})
        print(res.status_code)
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
                "content": "This Discord account isn’t linked yet. Run `/linkme` to link."
            }
        }
    return {
        "type": 4,
        "data": {"flags": EPHEMERAL,
                 "content": f"Your sign-in code: **{data['code']}**"}
    }