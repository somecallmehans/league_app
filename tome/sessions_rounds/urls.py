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
    get_round_participants,
    get_all_rounds,
    get_participant_recent_pods,
    signup,
    signin_counts,
    post_signin,
    delete_signin,
    update_pod_participants,
    delete_pod_participant,
    get_pod_participants,
    get_rounds_by_session,
)

urlpatterns = [
    path(
        "get_participant_recent_pods/<int:participant_id>/",
        get_participant_recent_pods,
        name="get_participant_recent_pods",
    ),
    path(
        "get_participant_recent_pods/<int:participant_id>/<str:mm_yy>/",
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
    path("signup/", signup, name="signup"),
    path("signin_counts/", signin_counts, name="signin_counts"),
    path("post_signin/", post_signin, name="post_signin"),
    path("delete_signin/", delete_signin, name="delete_signin"),
    path(
        "update_pod_participants/",
        update_pod_participants,
        name="update_pod_participants",
    ),
    path(
        "delete_pod_participant/", delete_pod_participant, name="delete_pod_participant"
    ),
    path(
        "get_pod_participants/<int:pod_id>/",
        get_pod_participants,
        name="get_pod_participants",
    ),
    path(
        "get_rounds_by_session/<int:session_id>/",
        get_rounds_by_session,
        name="get_rounds_by_session",
    ),
    re_path(r"^get_all_rounds/$", get_all_rounds, name="get_all_rounds"),
    re_path(
        r"^get_all_rounds/(?P<participant_id>\d+)/$",
        get_all_rounds,
        name="get_all_rounds_with_participant",
    ),
]
