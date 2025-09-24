from django.urls import path

from .views import mycode, search, link

urlpatterns = [
    path("mycode/<int:discord_user_id>/", mycode, name="mycode"),
    path("search/<str:query>/", search, name="search"),
    path("link/", link, name="link"),
]
