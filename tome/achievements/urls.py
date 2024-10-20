from django.urls import path
from .views import (
    get_achievements_with_restrictions,
    post_achievements_for_participants,
    upsert_achievements,
    get_colors,
    get_achievements_by_participant_session,
    upsert_participant_achievements,
    get_achievements_by_participant_month,
)

urlpatterns = [
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
