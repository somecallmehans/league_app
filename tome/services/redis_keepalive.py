import time
import redis
from django.conf import settings


def redis_keepalive():
    r = redis.from_url(settings.REDIS_URL, ssl=True)
    r.set("league_keepalive", str(time.time()), ex=86400)
