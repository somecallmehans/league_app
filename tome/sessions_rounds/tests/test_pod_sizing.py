from sessions_rounds.pod_sizing import partition_into_pods


def test_partition_nine_prefer_five_on():
    pods = partition_into_pods(list(range(1, 10)), prefer_5_pod=True)
    assert [len(p) for p in pods] == [4, 5]
    assert pods == [[1, 2, 3, 4], [5, 6, 7, 8, 9]]


def test_partition_nine_prefer_five_off():
    pods = partition_into_pods(list(range(1, 10)), prefer_5_pod=False)
    assert [len(p) for p in pods] == [3, 3, 3]
    assert pods == [[1, 2, 3], [4, 5, 6], [7, 8, 9]]


def test_partition_five_prefer_five_off_escape_hatch():
    pods = partition_into_pods(list(range(1, 6)), prefer_5_pod=False)
    assert pods == [[1, 2, 3, 4, 5]]


def test_partition_thirteen_prefer_five_off():
    pods = partition_into_pods(list(range(1, 14)), prefer_5_pod=False)
    assert [len(p) for p in pods] == [4, 3, 3, 3]
