from django.urls import path
from .views import get_all_metrics, get_metrics_for_participant, get_earned_badges

urlpatterns = [
    path(
        "metrics/participant/<int:participant_id>/",
        get_metrics_for_participant,
        name="participant_metrics",
    ),
    path("metrics/", get_all_metrics, name="metrics"),
    path("badges/", get_earned_badges, name="badges"),
]
