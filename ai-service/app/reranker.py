import math
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from app.config import settings


class GeoCandidate(BaseModel):
    landmarkId: int
    name: str
    objectType: str = "BUILDING"
    distanceMeters: float
    bearingDegrees: Optional[float] = None
    visibilityRadiusMeters: Optional[float] = 150.0


class ScoredCandidate(BaseModel):
    landmarkId: int
    name: str
    score: float
    visualScore: float
    geoScore: float
    headingScore: Optional[float] = None
    distanceMeters: float
    bearingDegrees: Optional[float] = None
    objectType: str
    matchedViewId: Optional[str] = None


def compute_heading_score(heading_deg: Optional[float], bearing_deg: Optional[float]) -> Optional[float]:
    if heading_deg is None or bearing_deg is None:
        return None
    delta = abs(((heading_deg - bearing_deg + 180.0) % 360.0) - 180.0)
    return max(0.0, math.cos(math.radians(delta)))


def rerank_candidates(
    geo_candidates: List[GeoCandidate],
    visual_matches_by_landmark: Dict[int, Tuple[float, str]],
    gps_accuracy_meters: Optional[float],
    heading_degrees: Optional[float],
    heading_accuracy: Optional[float],
    detection_fallback: bool,
) -> Tuple[str, Optional[ScoredCandidate], List[ScoredCandidate]]:
    if not geo_candidates:
        return "NOT_FOUND", None, []

    has_reliable_heading = (
        heading_degrees is not None
        and (heading_accuracy is None or heading_accuracy <= 35.0)
    )

    scored: List[ScoredCandidate] = []
    acc_offset = max(0.0, gps_accuracy_meters or 0.0)

    for cand in geo_candidates:
        vis_raw, view_id = visual_matches_by_landmark.get(cand.landmarkId, (0.0, ""))
        # Cosine similarity [-1, 1] -> [0, 1]
        s_visual = max(0.0, min(1.0, (vis_raw + 1.0) / 2.0 if vis_raw < 0 else vis_raw))
        if detection_fallback:
            s_visual *= 0.90  # невеликий штраф, якщо детектор не виділив чіткий об'єкт

        effective_radius = max(cand.visibilityRadiusMeters or settings.geo_search_radius_meters, settings.geo_search_radius_meters)
        effective_distance = max(0.0, cand.distanceMeters - acc_offset)
        s_geo = max(0.0, min(1.0, 1.0 - (effective_distance / effective_radius)))

        s_heading = (
            compute_heading_score(heading_degrees, cand.bearingDegrees)
            if has_reliable_heading
            else None
        )

        if s_heading is not None:
            final_score = (
                settings.visual_weight * s_visual
                + settings.geo_weight * s_geo
                + settings.heading_weight * s_heading
            )
        else:
            w_sum = settings.visual_weight + settings.geo_weight
            final_score = (settings.visual_weight * s_visual + settings.geo_weight * s_geo) / w_sum

        scored.append(
            ScoredCandidate(
                landmarkId=cand.landmarkId,
                name=cand.name,
                score=round(final_score, 4),
                visualScore=round(s_visual, 4),
                geoScore=round(s_geo, 4),
                headingScore=round(s_heading, 4) if s_heading is not None else None,
                distanceMeters=round(cand.distanceMeters, 2),
                bearingDegrees=round(cand.bearingDegrees, 2) if cand.bearingDegrees is not None else None,
                objectType=cand.objectType,
                matchedViewId=view_id or None,
            )
        )

    scored.sort(key=lambda x: x.score, reverse=True)

    top1 = scored[0]
    top2_score = scored[1].score if len(scored) > 1 else 0.0

    # Якщо візуальної схожості фактично немає (< 0.45) — об'єкт не впізнано
    if top1.visualScore < 0.45:
        return "NOT_FOUND", None, scored

    if top1.score < settings.match_threshold:
        return "UNCERTAIN", top1, scored

    if len(scored) > 1 and (top1.score - top2_score) < settings.match_margin_threshold:
        return "UNCERTAIN", top1, scored

    return "MATCHED", top1, scored