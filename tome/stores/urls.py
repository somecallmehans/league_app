from django.urls import path
from .views import get_store

urlpatterns = [path("store/", get_store, name="get_store")]
