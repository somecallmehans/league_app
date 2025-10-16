import requests
from django.conf import settings


def bot_announcement(payload: dict[str, str]) -> None:
    """Make a request out to our discord bot to post in the channel."""

    print(settings.BOT_ANNOUNCE_URL)
    try:
        r = requests.post(
            settings.BOT_ANNOUNCE_URL,
            json=payload,
            headers={"X-Api-Key": settings.BOT_TOKEN},
            timeout=4,
        )

        if r.status_code >= 400:
            print("Bot announce failed: %s %s", r.status_code, r.text[:500])

    except Exception as e:
        print("Bot announce exception", e)
