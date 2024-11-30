from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)

from .helpers import MetricsCalculator


@api_view(["GET"])
def get_all_metrics(request):
    """Get all of the metrics we want and gather them in a nice object."""

    calculator = MetricsCalculator()
    metrics = calculator.build_metrics()

    return Response(metrics, status=status.HTTP_200_OK)
