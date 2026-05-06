"""
Stage 5 – Scoring Algorithm
Composite score (0-100) weighted across five factors:
  • Skill match      35 %
  • Availability     25 %
  • Experience       20 %
  • Past performance 20 %
  minus workload penalty (up to -20 pts)
Mirrors the calculateMatchScore() helper in the frontend's helpers.js exactly.
"""

from ai_engine.skill_matching    import skill_score
from ai_engine.availability_check import availability_score
from ai_engine.workload_balance    import workload_penalty


WEIGHTS = {
    "skill":  0.35,
    "avail":  0.25,
    "exp":    0.20,
    "perf":   0.20,
}

MAX_EXPERIENCE_YEARS = 10   # experience is normalised against this cap


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def compute_score(employee: dict, required_skills: list) -> float:
    """
    Returns the composite match score for an employee against a set of required skills.
    """
    s_skill = skill_score(employee.get("skills", []), required_skills)
    s_avail = availability_score(employee.get("availability", "Leave"))
    s_exp   = clamp((employee.get("experience", 0) / MAX_EXPERIENCE_YEARS) * 100)
    s_perf  = float(employee.get("pastPerformance", employee.get("past_performance", 75)))
    penalty = workload_penalty(employee.get("currentProjects", employee.get("current_projects", 0)))

    raw = (
        s_skill * WEIGHTS["skill"]
        + s_avail * WEIGHTS["avail"]
        + s_exp   * WEIGHTS["exp"]
        + s_perf  * WEIGHTS["perf"]
        - penalty
    )

    return round(clamp(raw))


def score_breakdown(employee: dict, required_skills: list) -> dict:
    """Returns per-factor scores alongside the composite for transparency."""
    s_skill = skill_score(employee.get("skills", []), required_skills)
    s_avail = availability_score(employee.get("availability", "Leave"))
    s_exp   = clamp((employee.get("experience", 0) / MAX_EXPERIENCE_YEARS) * 100)
    s_perf  = float(employee.get("pastPerformance", employee.get("past_performance", 75)))
    penalty = workload_penalty(employee.get("currentProjects", employee.get("current_projects", 0)))

    composite = clamp(
        s_skill * WEIGHTS["skill"]
        + s_avail * WEIGHTS["avail"]
        + s_exp   * WEIGHTS["exp"]
        + s_perf  * WEIGHTS["perf"]
        - penalty
    )

    return {
        "skillScore":        round(s_skill),
        "availabilityScore": round(s_avail),
        "experienceScore":   round(s_exp),
        "performanceScore":  round(s_perf),
        "workloadPenalty":   round(penalty),
        "composite":         round(composite),
    }
