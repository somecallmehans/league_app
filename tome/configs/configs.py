from typing import Any, Callable
from django.core.cache import cache
from .models import Config

# CACHE_TTL = 60
# PREFIX = "config:"

# This is a bunch of stuff ChatGPT generated that seems useful
# But for the sake of getting this out we will ignore for now.
# def _ck(scope_kind: str, scope_id: str | None, key: str) -> str:
#     return f"{PREFIX}{scope_kind}:{scope_id or '∅'}:{key}"


# def _maybe_cast(val, default, cast):
#     if cast and val is not None:
#         try:
#             return cast(val)
#         except (TypeError, ValueError):
#             return default
#     return val


# def set_config(key: str, value, description: str = ""):
#     # scope_kind = Config.Scope.SHOP if shop_id else Config.Scope.GLOBAL
#     obj, _ = Config.objects.update_or_create(
#         scope_kind=Config.Scope.GLOBAL,
#         key=key,
#         defaults={"value": value, "description": description},
#     )
#     cache.delete(_ck(key))
#     return obj


# def get_config(key: str, default=None, cast=None):
#     """
#     key: That actual reference key to the db config i.e. round-one-cap
#     default: optional default val
#     """
#     # TODO: When prudent, add in a shop_id check prior to grabbing the global
#     gkey = _ck(Config.Scope.GLOBAL, None, key)
#     gval = cache.get(gkey)
#     if gval is None:
#         try:
#             gval = (
#                 Config.objects.only("value")
#                 .get(scope_kind=Config.Scope.GLOBAL, scope_id=None, key=key)
#                 .value
#             )
#         except Config.DoesNotExist:
#             gval = None
#         cache.set(gkey, gval, CACHE_TTL)

#     return _maybe_cast(gval if gval is not None else default, default, cast)


# Casting stuff for configs
def to_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v

    if isinstance(v, (int, float)):
        return bool(v)

    if isinstance(v, str):
        s = v.strip().lower()
        if s in {"true", "1", "yes", "on"}:
            return True
        if s in {"false", "0", "no", "off"}:
            return False
    raise ValueError("Invalid boolean")


def to_int(v: Any) -> int:
    return int(v)


def to_float(v: Any) -> float:
    return float(v)


CONFIG_SPEC: dict[str, dict[str, Callable[[Any], Any]]] = {
    "round_one_cap": {"cast": to_int},
    "round_two_cap": {"cast": to_int},
}


def get_round_caps():
    caps = dict(
        Config.objects.filter(key__in=["round_one_cap", "round_two_cap"]).values_list(
            "key", "value"
        )
    )
    # sane defaults if missing
    return int(caps.get("round_one_cap", 24)), int(caps.get("round_two_cap", 24))
