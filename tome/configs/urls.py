from django.urls import path

from .views import get_all_configs, update_config

urlpatterns = [
    path("all/", get_all_configs, name="all_configs"),
    path("update/<str:key>/", update_config, name="update"),
]
