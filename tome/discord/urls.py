from django.urls import path

from .views import mycode

urlpatterns = [
    path("mycode/<int:discord_user_id>", mycode, name="mycode"),
    # path(),
    # path(),
]
