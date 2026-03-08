from django.urls import path

from .views import (
    mycode,
    search,
    link,
    next_session,
    signin,
    drop_user,
    issue_edit_token,
    check_join_status,
    find_participants,
    register_and_join,
    ensure_store_membership,
    validate_channel,
    update_name,
    get_current_names,
)

urlpatterns = [
    path("mycode/<int:discord_user_id>/", mycode, name="mycode"),
    path("search/<str:query>/", search, name="search"),
    path("link/", link, name="link"),
    path("next_session/", next_session, name="next_session"),
    path("signin/", signin, name="signin"),
    path("drop/", drop_user, name="drop"),
    path("issue_token/", issue_edit_token, name="issue_edit_token"),
    path("validate_channel/", validate_channel, name="validate_channel"),
    path("join/status/", check_join_status, name="join_status"),
    path("join/find/", find_participants, name="find_join"),
    path("join/register/", register_and_join, name="register_and_join"),
    path("join/ensure-store/", ensure_store_membership, name="ensure_store_membership"),
    path("update_name/", update_name, name="update_name"),
    path("update_name/current/", get_current_names, name="get_current_names"),
]
