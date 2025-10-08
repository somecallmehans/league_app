from django.urls import path

from .views import mycode, search, link, next_session, signin

urlpatterns = [
    path("mycode/<int:discord_user_id>/", mycode, name="mycode"),
    path("search/<str:query>/", search, name="search"),
    path("link/", link, name="link"),
    path("next_session/", next_session, name="next_session"),
    path("signin/", signin, name="signin"),
]
