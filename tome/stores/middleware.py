import re
from typing import Optional


from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseRedirect

from django.conf import settings


from .models import Store

STORE_PATH_RE = re.compile(r"^/s/(?P<slug>[-a-zA-Z0-9_]+)/")


class StoreResolverMiddleware(MiddlewareMixin):
    """
    Resolves store context from our host.

    Attaches:
      request.store, request.store_id, request.store_slug
    """

    def process_request(self, request):
        request.store = None
        request.store_id = None
        request.store_slug = None

        slug = self._slug_from_path(request.path_info) or self._slug_from_host(request)

        if not slug:
            return

        store = (
            Store.objects.filter(slug=slug, deleted=False, is_active=True)
            .only("id", "slug", "name")
            .first()
        )

        if store is None:
            return

        request.store = store
        request.store_id = store.id
        request.store_slug = store.slug

    def _slug_from_host(self, request) -> Optional[str]:
        """
        Matches <slug>.<base_domain>
        """

        host = request.get_host().split(":")[0].lower()

        parts = host.split(".")
        if len(parts) < 2:
            return None

        base = ".".join(parts[1:])

        if base not in settings.BASE_DOMAINS:
            return None

        slug = parts[0]

        if slug in {"www", "api", "staging"}:
            return None

        return slug

    def _slug_from_path(self, path: str) -> Optional[str]:
        """
        Matches /s/<slug>/... (requires trailing slash after slug)
        Example: /s/storeone/standings -> storeone
        """
        m = STORE_PATH_RE.match(path)
        return m.group("slug") if m else None


class InvalidStoreRedirectMiddleware(MiddlewareMixin):
    """
    Redirect invalid store subdomains to apex.

    Examples:
      - mimicsmarket.commanderleague.xyz -> allowed if store exists
      - nope.commanderleague.xyz  -> redirect to commanderleague.xyz
      - commanderleague.xyz       -> allowed (no redirect)
      - localhost / *.localhost   -> allowed (no redirect)
      - reserved subdomains (www/api/staging) -> allowed (no redirect)
    """

    RESERVED_SUBDOMAINS = {"www", "api", "staging", "admin"}

    def process_request(self, request):
        host = request.get_host().split(":")[0].lower()
        if (
            host in {"localhost", "127.0.0.1"}
            or host.endswith(".localhost")
            or host.endswith(".local")
        ):
            return None

        parts = host.split(".")
        if len(parts) < 2:
            return None

        subdomain = parts[0]
        base = ".".join(parts[1:])

        if base not in settings.BASE_DOMAINS:
            return None

        if host == base:
            return None

        if subdomain in self.RESERVED_SUBDOMAINS:
            return None

        exists = Store.objects.filter(
            slug=subdomain,
            deleted=False,
            is_active=True,
        ).exists()

        if not exists:
            apex = getattr(settings, "APEX_DOMAIN", base)
            return HttpResponseRedirect(f"https://{apex}{request.get_full_path()}")

        return None
