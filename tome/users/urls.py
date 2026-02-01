from django.urls import path
from .views import (
    get_all_participants,
    upsert_participant,
    Login,
    decklists,
    decklist,
    exchange_tokens,
)

urlpatterns = [
    path("", Login.as_view()),
    path("upsert_participant/", upsert_participant, name="upsert_participant"),
    path("participants/", get_all_participants, name="participant_list"),
    path("decklist/", decklist, name="decklist"),
    path("decklists/", decklists, name="decklists"),
    path("exchange/", exchange_tokens, name="exchange_tokens"),
]
