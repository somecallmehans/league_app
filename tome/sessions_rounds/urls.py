from django.urls import path
from .views import (
    sessions_and_rounds,
    begin_round,
    close_round,
    sessions_and_rounds_by_date,
    all_sessions,
    get_pods,
    get_unique_session_months,
)

urlpatterns = [
    path(
        "sessions_by_date/<str:mm_yy>/",
        sessions_and_rounds_by_date,
        name="sessions-and-rounds-by-date",
    ),
    path("pods/<int:round>/", get_pods, name="pods"),
    path("all_sessions/", all_sessions, name="all_sessions"),
    path("sessions/<str:mm_yy>/", sessions_and_rounds, name="make_sessions_and_rounds"),
    path("begin_round/", begin_round, name="begin_round"),
    path("close_round/", close_round, name="close_round"),
    path("unique_months/", get_unique_session_months, name="unique_months"),
]
