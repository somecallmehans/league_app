from configs.configs import get_prefer_5_pod
from configs.models import Config
from utils.test_helpers import get_ids

ids = get_ids()


def test_get_prefer_5_pod_defaults_true(db):
    assert get_prefer_5_pod(ids.MIMICS_ID) is True


def test_get_prefer_5_pod_reads_shop_config(db):
    Config.objects.create(
        key="prefer_5_pod",
        value="false",
        name="Prefer 5-player pods",
        description="When applicable, generate a pod of 5 instead of three 3 pods",
        scope_kind=Config.Scope.SHOP,
        store_id=ids.MIMICS_ID,
    )
    assert get_prefer_5_pod(ids.MIMICS_ID) is False
