from django.urls import path
from .views import (
    get_all_participants,
    upsert_participant,
    Login,
    change_password,
    decklists,
    decklist,
    exchange_tokens,
    verify_session_token,
    get_user_decklists,
    decklist_by_id,
    update_decklist,
    admin_get_decklists,
    admin_decklist_by_id,
    admin_update_decklist,
)

urlpatterns = [
    path("", Login.as_view()),
    path("change_password/", change_password, name="change_password"),
    path("upsert_participant/", upsert_participant, name="upsert_participant"),
    path("participants/", get_all_participants, name="participant_list"),
    path("decklist/", decklist, name="decklist"),
    path("decklists/", decklists, name="decklists"),
    path("decklist_by_id/", decklist_by_id, name="decklist_by_id"),
    path("update_decklist/", update_decklist, name="update_decklist"),
    path("exchange/", exchange_tokens, name="exchange_tokens"),
    path("verify_token/", verify_session_token, name="verify_session_token"),
    path("participant_decklists/", get_user_decklists, name="get_user_decklists"),
    path("admin_decklists/", admin_get_decklists, name="admin_get_decklists"),
    path("admin_decklist_by_id/", admin_decklist_by_id, name="admin_decklist_by_id"),
    path("admin_update_decklist/", admin_update_decklist, name="admin_update_decklist"),
]
