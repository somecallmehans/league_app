from django.urls import path

from .views import get_all_configs

urlpatterns = [path("all/", get_all_configs, name="all_configs")]
