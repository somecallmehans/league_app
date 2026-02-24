import time
from typing import Optional, Dict, Tuple


class TTLBoolCache:
    def __init__(self):
        self._data: Dict[str, Tuple[float, bool]] = {}

    def get(self, key: str) -> Optional[bool]:
        item = self._data.get(key)
        if not item:
            return None
        expires_at, value = item
        if time.time() >= expires_at:
            self._data.pop(key, None)
            return None
        return value

    def set(self, key: str, value: bool, ttl_seconds: int) -> None:
        self._data[key] = (time.time() + ttl_seconds, value)


CACHE = TTLBoolCache()

POS_TTL = 60 * 15
NEG_TTL = 60 * 2


def cache_key(guild_id: str, channel_id: str) -> str:
    return f"{guild_id}:{channel_id}"
