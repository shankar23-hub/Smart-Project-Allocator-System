"""
Stage 3 – Availability Check
Only employees who are not on Leave proceed at full weight.
Busy employees are penalised; Available employees are fully eligible.
"""

AVAILABILITY_SCORES = {
    "Available": 100,
    "Busy":       40,
    "Leave":       0,
}


def availability_score(availability: str) -> float:
    return float(AVAILABILITY_SCORES.get(availability, 0))


def is_eligible(availability: str) -> bool:
    """
    Employees on Leave are excluded from allocation entirely.
    Busy employees are still considered but with a lower score.
    """
    return availability != "Leave"
