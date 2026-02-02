from django.urls import path
from .views import (
    get_all_participants,
    upsert_participant,
    Login,
    decklists,
    decklist,
    exchange_tokens,
    verify_session_token,
    get_user_decklists,
    decklist_by_id,
)

urlpatterns = [
    path("", Login.as_view()),
    path("upsert_participant/", upsert_participant, name="upsert_participant"),
    path("participants/", get_all_participants, name="participant_list"),
    path("decklist/", decklist, name="decklist"),
    path("decklists/", decklists, name="decklists"),
    path("decklist_by_id/", decklist_by_id, name="decklist_by_id"),
    path("exchange/", exchange_tokens, name="exchange_tokens"),
    path("verify_token/", verify_session_token, name="verify_session_token"),
    path("participant_decklists/", get_user_decklists, name="get_user_decklists"),
]
