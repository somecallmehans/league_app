from django.urls import path

from .views import (
    mycode,
    search,
    link,
    next_session,
    signin,
    drop_user,
    issue_edit_token,
)

urlpatterns = [
    path("mycode/<int:discord_user_id>/", mycode, name="mycode"),
    path("search/<str:query>/", search, name="search"),
    path("link/", link, name="link"),
    path("next_session/", next_session, name="next_session"),
    path("signin/", signin, name="signin"),
    path("drop/", drop_user, name="drop"),
    path("issue_token/", issue_edit_token, name="issue_edit_token"),
]
