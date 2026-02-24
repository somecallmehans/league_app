import os, httpx, time

from .cache import CACHE, cache_key, POS_TTL, NEG_TTL
from .helpers import (
    join_name_modal,
    confirm_link_prompt,
    select_existing_prompt,
    ephemeral,
)

API_BASE = os.getenv("LEAGUE_API_BASE")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN")

EPHEMERAL = 64
SELECTIONS = {}
TTL = 15 * 60


async def validate_channel(guild_id: int, channel_id: int):
    """Validate that the channel the request is coming from is an approved league channel.

    Do this either via cache or the api.
    """
    key = cache_key(str(guild_id), str(channel_id))

    cached = CACHE.get(key)
    if cached is not None:
        return cached

    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            f"{API_BASE}api/discord/validate_channel/",
            json={"guild_id": guild_id, "channel_id": channel_id},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
            },
        )
    if res.status_code == 204:
        CACHE.set(key, True, POS_TTL)
        return True

    if res.status_code in (400, 404, 500):
        CACHE.set(key, False, NEG_TTL)
        return False


async def get_code(discord_user_id: int, guild_id: int):
    async with httpx.AsyncClient(timeout=10) as http:
        url = f"{API_BASE}api/discord/mycode/{discord_user_id}/"
        res = await http.get(
            url,
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        if res.status_code == 200:
            return res.json()

    return None


async def handle_getcode(user_id: int, guild_id: int):
    data = await get_code(user_id, guild_id)
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


async def search_unlinked(query: str, guild_id: int):
    if not query:
        return []
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            f"{API_BASE}api/discord/search/{query}/",
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return r.json() if r.status_code == 200 else []


async def handle_participant_autocomplete(query: str, guild_id: int):
    res = await search_unlinked(query, guild_id)
    choices = [
        {
            "name": r["name"],
            "value": f"{r['name']}:{r['id']}",
        }
        for r in res[:10]
    ]
    return {"type": 8, "data": {"choices": choices}}


async def link(discord_user_id: int, participant_id: int, guild_id: int):
    url = f"{API_BASE}api/discord/link/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"discord_user_id": discord_user_id, "participant_id": participant_id},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return res


async def handle_link(user_id: int, participant_value: str, guild_id: int):
    val = participant_value.split(":")
    if len(val) < 2:
        return ephemeral(
            "Sorry, I don't recognize that name. You can only link a previously unlinked league participant."
        )
    name = val[0]
    pid = int(val[1])
    res = await link(user_id, pid, guild_id)
    if res.status_code == 201:
        code = res.json()["code"]
        msg = (
            f"✅ Link successful. You are now able to sign in for league using **/signin**\n\n "
            f"You can also sign in using your unique code: **{code}** on our website.\n "
            "You can view it any time with **/mycode**."
        )
    else:
        msg = "Could not link accounts, please contact a league admin."

    return {"type": 4, "data": {"flags": EPHEMERAL, "content": msg}}


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
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        if r.status_code != 200:
            return ephemeral("Couldn't find an upcoming session.")

        data = r.json()

    rounds = [r for r in (data.get("rounds") or [])[:2] if not r.get("is_full")]
    if not rounds:
        return ephemeral("Unfortunately, both rounds are full.")

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

    return {
        "type": 7,
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
        return ephemeral("Please choose at least one round first.")

    round_ids = [int(x) for x in sel]

    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            f"{API_BASE}api/discord/signin/",
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
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
    return ephemeral(f"❌ {msg}")


async def handle_drop(uid, guild_id):
    """Handle dropping a participant from their league rounds."""

    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            f"{API_BASE}api/discord/drop/",
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
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
    return ephemeral(f"❌ {msg}")


async def handle_edit_decklist_url(uid: int, guild_id: int):
    """Handle issuing a URL for users to edit their stored decklists."""

    async with httpx.AsyncClient(timeout=10) as http:
        resp = await http.post(
            f"{API_BASE}api/discord/issue_token/",
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
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
        slug = res["slug"]
        url = "{slug}.commanderleague.xyz/decklists/gatekeeper".format(slug=slug)
        return {
            "type": 4,
            "data": {
                "flags": EPHEMERAL,
                "content": (
                    f"Your edit code: **{res['code']}**\n\n"
                    "[Click here to edit your decklists]"
                    f"(https://" + url + ")\n\n"
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


async def join_status(discord_user_id: int, guild_id: int) -> httpx.Response:
    """
    Check if this Discord user is already linked, and are they already a member of this store?
    Store context is derived from X-DISCORD-GUILD-ID.
    Expected response shape (example):
      {
        "is_linked": true,
        "participant_id": 123,
        "participant_name": "Taylor Smith",
        "in_store": true,
        "store_name": "Mimic's Market"
      }
    """
    url = f"{API_BASE}api/discord/join/status/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"discord_user_id": discord_user_id},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return res


async def find_participants(query: str, guild_id: int) -> httpx.Response:
    """
    Search participants by name (and ideally scoped to the store implied by guild_id).
    Expected response shape (example):
      {
        "matches": [
          { "id": 123, "name": "Taylor Smith" },
          { "id": 456, "name": "Taylor S" }
        ]
      }

    The score can be omitted if you don't implement it yet. The bot can treat it as 0.
    """
    url = f"{API_BASE}api/discord/join/find/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"query": query},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return res


async def register_and_join(
    discord_user_id: int, name: str, guild_id: int
) -> httpx.Response:
    """
    Create participant (if needed), link them to this Discord user, and ensure store membership.
    This should be a single backend call so the bot stays dumb and the operation is atomic-ish.

    Expected response shape (example):
      {
        "participant_id": 123,
        "participant_name": "Taylor Smith",
        "code": "ABCD1234",
        "linked": true,
        "in_store": true,
        "store_name": "Mimic's Market"
      }
    """
    url = f"{API_BASE}api/discord/join/register/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"discord_user_id": discord_user_id, "name": name},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return res


async def ensure_store_membership(
    discord_user_id: int, guild_id: int
) -> httpx.Response:
    """
    Ensure the linked participant (or the discord user) is associated with the store for this guild.
    This should be idempotent. If already in store, return 200.
    If newly added, return 201.
    """
    url = f"{API_BASE}api/discord/join/ensure-store/"
    async with httpx.AsyncClient(timeout=10) as http:
        res = await http.post(
            url,
            json={"discord_user_id": discord_user_id},
            headers={
                "Authorization": f"X-SERVICE-TOKEN {SERVICE_TOKEN}",
                "X-DISCORD-GUILD-ID": str(guild_id),
            },
        )
        return res


async def handle_join_link_existing(
    user_id: int, participant_value: str, guild_id: int
):
    """Link an existing participant, also maybe add them to the store."""
    try:
        name, pid_str = participant_value.split(":")
        pid = int(pid_str)
    except Exception:
        return ephemeral("That selection didn’t look right. Try /join again.")

    res = await link(user_id, pid, guild_id)
    if res.status_code == 201:
        parsed = res.json()
        code = parsed["code"]
        await ensure_store_membership(user_id, guild_id)

        msg = (
            f"✅ Link successful. You are now able to sign in for league using **/signin**\n\n "
            f"You can also sign in using your unique code: **{code}** on our website.\n "
            "You can view it any time with **/mycode**."
        )

        return ephemeral(msg)

    return ephemeral("Could not link accounts. Please contact a league admin.")


async def handle_join(user_id: int, participant_value: str, guild_id: int):
    """Handle all of the joining, whether that's joining a store, linking your account,
    or joining league as a whole."""

    status = await join_status(user_id, guild_id)

    if status.status_code != 200:
        return ephemeral("Something went wrong, please contact a league admin.")

    s = status.json()
    if s.get("is_linked"):
        if not s.get("in_store"):
            res = await ensure_store_membership(user_id, guild_id)
            if res.status_code in (200, 201):
                return ephemeral(
                    f"✅ You have been added to **{s.get('store_name', 'this store')}**."
                )
            return ephemeral(
                "Could not add you to this store. Please contact a league admin."
            )
        return ephemeral("✅ You’re already set up for this store.")

    if participant_value:
        return await handle_join_link_existing(user_id, participant_value, guild_id)
    return join_name_modal()


async def handle_join_name_submit(user_id: int, name: str, guild_id: int):

    if not name:
        return ephemeral("Please enter a name to continue.")

    res = await find_participants(name, guild_id)
    if res.status_code != 200:
        return ephemeral("Could not search names right now. Please try again.")

    matches = res.json().get("matches", [])

    if len(matches) == 0:
        created = await register_and_join(user_id, name, guild_id)
        parsed = created.json()
        if created.status_code in (200, 201):
            code = created.json().get("code")
            msg = (
                f"✅ You’re all set, **{name}**.\n\n"
                "You can now use **/signin** in this channel to register for Commander League.\n\n"
                f"You can also sign in using your unique code: **{code}** on our website.\n "
                "You can view it any time with **/mycode**."
            )
            return ephemeral(msg)
        msg = (
            parsed.get("message")
            or "Could not create your account. Please contact a league admin."
        )
        return ephemeral(msg)

    if len(matches) == 1:
        m = matches[0]
        return confirm_link_prompt(m["name"], m["id"])

    return select_existing_prompt(matches)


async def handle_join_confirm(uid, pid, guild_id):
    """Link to the given participant id, then ensure store membership."""
    res = await link(uid, pid, guild_id)
    if res.status_code == 201:
        await ensure_store_membership(uid, guild_id)
        parsed = res.json()
        code = parsed.get("code")
        msg = (
            f"✅ Link successful. You are now able to sign in for league using **/signin**\n\n "
            f"You can also sign in using your unique code: **{code}** on our website.\n "
            "You can view it any time with **/mycode**."
        )
        return ephemeral(msg)

    msg = "Could not link accounts, please contact a league admin."
    try:
        msg = res.json().get("message") or msg
    except Exception:
        pass
    return ephemeral(f"❌ {msg}")
