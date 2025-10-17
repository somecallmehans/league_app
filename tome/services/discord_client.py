import requests
from django.conf import settings


def bot_announcement(payload: dict[str, str]) -> None:
    """Make a request out to our discord bot to post in the channel."""

    try:
        requests.post(
            settings.BOT_ANNOUNCE_URL,
            json=payload,
            headers={"X-Api-Key": settings.BOT_TOKEN},
            timeout=4,
        )

    except Exception:
        pass
