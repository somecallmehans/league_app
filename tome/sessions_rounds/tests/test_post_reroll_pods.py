from django.urls import reverse
from rest_framework import status

from utils.test_helpers import get_ids


def test_post_reroll_pods(client) -> None:
    """Take in a round_id and a list of participants.

    Take the existing pods_participants relations, blow them away
    and return them aligned in a way that befits the current round.
    """
