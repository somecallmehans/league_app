from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view


from .helpers import MetricsCalculator


@api_view(["GET"])
def get_all_metrics(request):
    """Get all of the metrics we want and gather them in a nice object."""

    try:
        calculator = MetricsCalculator()
        metrics = calculator.build_metrics()
        return Response(metrics, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in get_all_metrics endpoint: {e}")
        return Response(
            {"error": "An error occurred while fetching metrics", "details": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
