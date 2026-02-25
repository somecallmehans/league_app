from typing import Optional

EPHEMERAL = 64


def ephemeral(
    content: str,
    components: Optional[list] = None,
    embeds: Optional[list] = None,
):
    data = {
        "flags": EPHEMERAL,
        "content": content,
    }

    if components:
        data["components"] = components

    if embeds:
        data["embeds"] = embeds

    return {
        "type": 4,
        "data": data,
    }


def select_existing_prompt(matches: list[dict]):
    options = []
    for m in matches[:25]:
        pid = m["id"]
        nm = m["name"]
        options.append(
            {
                "label": nm[:100],
                "value": f"{nm}:{pid}",
            }
        )

    return {
        "type": 4,
        "data": {
            "flags": EPHEMERAL,
            "content": 'I found a few people with that name. Pick yours, or choose "I\'m new".',
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 3,
                            "custom_id": "join:pick",
                            "placeholder": "Select your name",
                            "options": options,
                        }
                    ],
                },
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 2,
                            "label": "I'm new",
                            "custom_id": "join:new",
                        },
                    ],
                },
            ],
        },
    }


def join_name_modal():
    return {
        "type": 9,
        "data": {
            "custom_id": "join:name",
            "title": "Join the league",
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 4,
                            "custom_id": "name",
                            "style": 1,
                            "label": "Your name/identity",
                            "placeholder": "Example: Taylor Smith",
                            "required": True,
                            "min_length": 2,
                            "max_length": 64,
                        }
                    ],
                }
            ],
        },
    }


def confirm_link_prompt(name: str, pid: int):
    return {
        "type": 4,
        "data": {
            "flags": EPHEMERAL,
            "content": f"I found **{name}**. Is this you?",
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "style": 3,
                            "label": "Yes",
                            "custom_id": f"join:confirm:{pid}",
                        },
                        {
                            "type": 2,
                            "style": 2,
                            "label": "No, I’m new",
                            "custom_id": "join:new",
                        },
                    ],
                }
            ],
        },
    }


def get_modal_value(data: dict, custom_id: str) -> str:
    for row in data.get("components", []):
        for comp in row.get("components", []):
            if comp.get("custom_id") == custom_id:
                return (comp.get("value") or "").strip()
    return ""


def looks_like_selection(v: str) -> bool:
    if not v or ":" not in v:
        return False
    name, pid = v.split(":", 1)
    return bool(name.strip()) and pid.strip().isdigit()


def parse_join_confirm(custom_id: str) -> Optional[int]:
    # custom_id format: "join:confirm:<pid>"
    parts = (custom_id or "").split(":")
    if (
        len(parts) == 3
        and parts[0] == "join"
        and parts[1] == "confirm"
        and parts[2].isdigit()
    ):
        return int(parts[2])
    return None
