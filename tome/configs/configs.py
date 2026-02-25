from typing import Any, Callable
from .models import Config


def to_int(v: Any) -> int:
    return int(v)


def to_float(v: Any) -> float:
    return float(v)


CONFIG_SPEC: dict[str, dict[str, Callable[[Any], Any]]] = {
    "round_one_cap": {"cast": to_int},
    "round_two_cap": {"cast": to_int},
}


def get_round_caps(store_id: int) -> tuple[int, int]:
    caps = dict(
        Config.objects.filter(
            key__in=["round_one_cap", "round_two_cap"], store_id=store_id
        ).values_list("key", "value")
    )
    r1_cast = CONFIG_SPEC["round_one_cap"]["cast"]
    r2_cast = CONFIG_SPEC["round_two_cap"]["cast"]
    return (
        r1_cast(caps.get("round_one_cap", 24)),
        r2_cast(caps.get("round_two_cap", 24)),
    )
