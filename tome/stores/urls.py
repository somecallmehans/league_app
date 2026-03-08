from django.urls import path
from .views import get_store, get_stores

urlpatterns = [
    path("store/", get_store, name="get_store"),
    path("store_list/", get_stores, name="get_stores"),
]
