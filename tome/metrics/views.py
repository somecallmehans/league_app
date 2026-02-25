from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view

from utils.decorators import require_store
from .helpers import MetricsCalculator, IndividualMetricsCalculator, calculate_badges


@api_view(["GET"])
@require_store
def get_all_metrics(request, **kwargs):
    """Get all of the metrics we want and gather them in a nice object."""
    try:
        period = request.query_params.get("period")
        calculator = MetricsCalculator(store_id=request.store_id)
        metrics = calculator.build_metrics(period)
        return Response(metrics, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in get_all_metrics endpoint: {e}")
        return Response(
            {"message": "An error occurred while fetching metrics"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@require_store
def get_metrics_for_participant(request, participant_id, **kwargs):
    """Get all of the data we want for a given participant and shape it into
    some nice metrics we can display on the frontend."""

    try:
        calculator = IndividualMetricsCalculator(
            participant_id=participant_id, store_id=request.store_id
        )
        metrics = calculator.build()
        return Response(metrics, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in get_all_metrics endpoint: {e}")
        return Response(
            {"message": "An error occurred while fetching metrics"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@require_store
def get_earned_badges(request, **kwargs):
    """Return lists of achievements and whether a participant has earned
    each one or not."""

    pid = request.query_params.get("participant_id")
    if not pid:
        return Response(
            {"detail": "participant_id is required"}, status=status.HTTP_400_BAD_REQUEST
        )
    pid = int(pid)

    out = calculate_badges(pid, request.store_id)

    return Response(out)
