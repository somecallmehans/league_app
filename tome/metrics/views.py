from django.shortcuts import render

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view


from .helpers import MetricsCalculator, IndividualMetricsCalculator


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


@api_view(["GET"])
def get_metrics_for_participant(_, participant_id):
    """Get all of the data we want for a given participant and shape it into
    some nice metrics we can display on the frontend."""

    try:
        calculator = IndividualMetricsCalculator(participant_id=participant_id)
        metrics = calculator.build()
        return Response(metrics, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in get_all_metrics endpoint: {e}")
        return Response(
            {"error": "An error occurred while fetching metrics", "details": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
