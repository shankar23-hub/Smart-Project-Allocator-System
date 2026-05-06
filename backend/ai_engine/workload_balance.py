"""
Stage 4 – Workload Balance
Employees already overloaded with projects receive a penalty so the allocator
distributes assignments evenly across the team.
"""


def workload_penalty(current_projects: int) -> float:
    """
    Returns a score deduction (0–20 points) based on the number of active projects.
      0–1 projects  → no penalty
      2   projects  → 10-point penalty
      3+  projects  → 20-point penalty
    """
    if current_projects > 2:
        return 20.0
    if current_projects > 1:
        return 10.0
    return 0.0


def workload_label(current_projects: int) -> str:
    if current_projects == 0:
        return "Free"
    if current_projects == 1:
        return "Light"
    if current_projects == 2:
        return "Moderate"
    return "Heavy"
