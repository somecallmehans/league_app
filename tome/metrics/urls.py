from django.urls import path
from .views import get_all_metrics

urlpatterns = [path("metrics/", get_all_metrics, name="metrics")]
