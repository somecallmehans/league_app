from metrics.helpers import MetricsCalculator, IndividualMetricsCalculator
from utils.test_helpers import get_ids

ids = get_ids()


def test_get_metrics_league_wide() -> None:
    """
    should: get data formatted for the frontends pie chart
    """
    calc = MetricsCalculator()
    metrics = calc.build_metrics()

    assert metrics["color_pie"] == {"rg": 2, "wub": 1}
    assert metrics["big_winners"] == [{"name": "Charlie Smith", "wins": 2}]
    assert metrics["most_earned"] == [{"name": "Kill the table", "count": 2}]
    assert metrics["common_commanders"] == {
        "Stangg, Echo Warrior": 1,
        "Yarus, Roar of the Old Gods": 1,
        "Hashaton, Scarab's Fist": 1,
    }
    assert metrics["top_winners"] == {"Trenna Thain": 1}


def test_get_metrics_individual() -> None:
    """
    should: get data formatted for the frontends pie chart
    """
    calc = IndividualMetricsCalculator(ids.P1)
    metrics = calc.build()

    assert metrics == {
        "participant_name": "Charlie Smith",
        "avg_win_points": 5.5,
        "win_number": 2,
        "attendance": 0,
        "lifetime_points": 11,
        "participant_since": "10/01/2024",
        "unique_achievements": 3,
        "session_points": {
            "11-24": [{"session": 1, "points": 6}, {"session": 2, "points": 5}]
        },
    }
