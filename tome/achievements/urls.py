from django.urls import path, re_path
from .views import (
    get_achievements_with_restrictions,
    upsert_achievements,
    get_colors,
    get_achievements_by_participant_month,
    get_participant_round_achievements,
    get_all_commanders,
    fetch_and_insert_commanders,
    upsert_earned_achievements,
    get_achievements_with_restrictions_v2,
    get_achievement_types,
    get_league_monthly_winners,
    get_league_monthly_winner_info,
    scoresheet,
    get_scorecard_achievement_options,
    get_scalable_terms,
    get_scalable_term_types,
    upsert_scalable_term,
    create_scalable_term_type,
)

urlpatterns = [
    path(
        "get_participant_round_achievements/<int:participant_id>/<int:round_id>/",
        get_participant_round_achievements,
        name="get_participant_round_achievements",
    ),
    re_path(
        r"^achievements_for_month(?:/(?P<mm_yy>[^/]+))?/$",
        get_achievements_by_participant_month,
        name="achievements_for_month",
    ),
    path("upsert_achievements/", upsert_achievements, name="upsert_achievements"),
    path(
        "achievements_restrictions/",
        get_achievements_with_restrictions,
        name="achievements_restrictions_list",
    ),
    path(
        "get_achievements/",
        get_achievements_with_restrictions_v2,
        name="get_achievements",
    ),
    path(
        "scorecard_achievement_options/",
        get_scorecard_achievement_options,
        name="get_scorecard_achievement_options",
    ),
    path(
        "scalable_terms/",
        get_scalable_terms,
        name="get_scalable_terms",
    ),
    path(
        "scalable_terms/upsert/",
        upsert_scalable_term,
        name="upsert_scalable_term",
    ),
    path(
        "scalable_term_types/",
        get_scalable_term_types,
        name="get_scalable_term_types",
    ),
    path(
        "scalable_term_types/create/",
        create_scalable_term_type,
        name="create_scalable_term_type",
    ),
    path("colors/", get_colors, name="colors"),
    path("commanders/", get_all_commanders, name="commanders"),
    path(
        "fetch_new_commanders/",
        fetch_and_insert_commanders,
        name="fetch_new_commanders",
    ),
    path(
        "upsert_earned_achievements/",
        upsert_earned_achievements,
        name="upsert_earned_achievements",
    ),
    path("get_achievement_types/", get_achievement_types, name="get_achievement_types"),
    path("get_league_winners/", get_league_monthly_winners, name="get_league_winners"),
    path(
        "get_league_winner/<str:mm_yy>/<int:participant_id>/",
        get_league_monthly_winner_info,
        name="get_leage_winner",
    ),
    path(
        "rounds/<int:round_id>/pods/<int:pod_id>/scoresheet/",
        scoresheet,
        name="scoresheet",
    ),
]
