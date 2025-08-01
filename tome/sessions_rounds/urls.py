from django.urls import path, re_path
from .views import (
    sessions_and_rounds,
    begin_round,
    close_round,
    sessions_and_rounds_by_date,
    all_sessions,
    get_pods,
    get_unique_session_months,
    get_pods_achievements,
    get_rounds_by_month,
    reroll_pods,
    get_round_participants,
    get_all_rounds,
    get_participant_recent_pods,
)

urlpatterns = [
    path(
        "get_participant_recent_pods/<int:participant_id>/",
        get_participant_recent_pods,
        name="get_participant_recent_pods",
    ),
    path(
        "sessions_by_date/<str:mm_yy>/",
        sessions_and_rounds_by_date,
        name="sessions-and-rounds-by-date",
    ),
    path("pods/<int:round>/", get_pods, name="pods"),
    path(
        "pods_achievements/<int:pod>/",
        get_pods_achievements,
        name="pods_achievements",
    ),
    path(
        "round_participants/<int:round>/",
        get_round_participants,
        name="round_participants",
    ),
    path("all_sessions/", all_sessions, name="all_sessions"),
    re_path(
        r"^sessions(?:/(?P<mm_yy>[^/]+))?/$",
        sessions_and_rounds,
        name="make_sessions_and_rounds",
    ),
    path("begin_round/", begin_round, name="begin_round"),
    path("close_round/", close_round, name="close_round"),
    path("unique_months/", get_unique_session_months, name="unique_months"),
    path("rounds_by_month/<str:mm_yy>/", get_rounds_by_month, name="rounds_by_month"),
    path("reroll_pods/", reroll_pods, name="reroll_pods"),
    re_path(r"^get_all_rounds/$", get_all_rounds, name="get_all_rounds"),
    re_path(
        r"^get_all_rounds/(?P<participant_id>\d+)/$",
        get_all_rounds,
        name="get_all_rounds_with_participant",
    ),
]
