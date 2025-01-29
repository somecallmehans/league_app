from django.urls import path
from .views import (
    get_achievements_with_restrictions,
    post_achievements_for_participants,
    upsert_achievements,
    get_colors,
    get_achievements_by_participant_session,
    upsert_participant_achievements,
    get_achievements_by_participant_month,
    upsert_participant_achievements_v2,
    get_participant_round_achievements,
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
    path("upsert_earned/", upsert_participant_achievements, name="upsert_earned"),
    path(
        "earned_for_session/<int:session_id>/",
        get_achievements_by_participant_session,
        name="earned_for_session",
    ),
    path(
        "achievements_for_month/<str:mm_yy>/",
        get_achievements_by_participant_month,
        name="achievements_for_month",
    ),
    path("upsert_achievements/", upsert_achievements, name="upsert_achievements"),
    path(
        "submit_achievements/",
        post_achievements_for_participants,
        name="submit_achievements",
    ),
    path(
        "achievements_restrictions/",
        get_achievements_with_restrictions,
        name="achievements_restrictions_list",
    ),
    path("colors/", get_colors, name="colors"),
]
