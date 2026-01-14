from django.urls import path
from .views import get_all_participants, upsert_participant, Login, get_decklists

urlpatterns = [
    path("", Login.as_view()),
    path("upsert_participant/", upsert_participant, name="upsert_participant"),
    path("participants/", get_all_participants, name="participant_list"),
    path("get_decklists/", get_decklists, name="get_decklists"),
]
