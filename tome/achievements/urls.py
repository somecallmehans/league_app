from django.urls import path, re_path
from .views import (
    get_achievements_with_restrictions,
    upsert_achievements,
    get_colors,
    get_achievements_by_participant_month,
    upsert_participant_achievements_v2,
    get_participant_round_achievements,
    get_all_commanders,
    fetch_and_insert_commanders,
    upsert_earned_achievements,
)

urlpatterns = [
    path(
        "get_participant_round_achievements/<int:participant_id>/<int:round_id>/",
        get_participant_round_achievements,
        name="get_participant_round_achievements",
    ),
    path(
        "upsert_earned_v2/", upsert_participant_achievements_v2, name="upsert_earned_v2"
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
]
