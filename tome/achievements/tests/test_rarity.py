from achievements.rarity import (
    RARITY_ORDER,
    RARITY_TIERS,
    _assign_rarity_by_percentile,
    compute_achievement_rarity_map,
)


def test_assign_rarity_by_percentile_single_item():
    result = _assign_rarity_by_percentile([(1, 100)])
    assert result[1] == RARITY_TIERS[0]


def test_assign_rarity_by_percentile_distributes_tiers():
    items = [(i, 100 - i) for i in range(10)]
    result = _assign_rarity_by_percentile(items)

    assert result[0][0] == "Most Popular"
    assert result[9][0] == "Mythic"
    assert len(set(result.values())) >= 2


def test_rarity_order_matches_tiers():
    assert RARITY_ORDER["Most Popular"] < RARITY_ORDER["Mythic"]


def test_compute_achievement_rarity_map_returns_dict(db):
    result = compute_achievement_rarity_map()
    assert isinstance(result, dict)
