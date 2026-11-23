import io
import json
import logging
import os
import time
import uuid
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from app.config import settings
from app.detector import ObjectDetector
from app.embedder import DinoEmbedder
from app.reranker import GeoCandidate, ScoredCandidate, rerank_candidates
from app.s3_indexer import build_index_from_backend_s3

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Brookivka AI Recognition Service", version=settings.model_version)

detector: Optional[ObjectDetector] = None
embedder: Optional[DinoEmbedder] = None
faiss_index: Optional[faiss.Index] = None
index_metadata: List[dict] = []


class RecognitionResponse(BaseModel):
    status: str
    requestId: str
    bestMatch: Optional[ScoredCandidate] = None
    candidates: List[ScoredCandidate] = []
    detectionFallback: bool
    modelVersion: str
    processingMs: int


def load_faiss_index() -> None:
    global faiss_index, index_metadata
    if os.path.exists(settings.faiss_index_path) and os.path.exists(settings.faiss_metadata_path):
        faiss_index = faiss.read_index(settings.faiss_index_path)
        with open(settings.faiss_metadata_path, "r", encoding="utf-8") as f:
            index_metadata = json.load(f)
    else:
        faiss_index = None
        index_metadata = []


@app.on_event("startup")
def startup_event() -> None:
    global detector, embedder
    detector = ObjectDetector()
    embedder = DinoEmbedder()
    load_faiss_index()

    # Якщо індекс порожній або ще не створений — автоматично підтягуємо фото з S3 через бекенд
    if faiss_index is None or faiss_index.ntotal == 0:
        try:
            summary = build_index_from_backend_s3(detector, embedder)
            load_faiss_index()
            logger.info("Auto-synced FAISS index from S3: %s", summary)
        except Exception as exc:
            logger.warning("Initial S3 index sync skipped: %s", exc)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "modelVersion": settings.model_version}


@app.get("/ready")
def ready() -> dict:
    if detector is None or embedder is None:
        raise HTTPException(status_code=503, detail="Models are not loaded yet")
    return {
        "status": "ready",
        "indexLoaded": faiss_index is not None,
        "indexedViews": len(index_metadata),
        "modelVersion": settings.model_version,
    }


@app.post("/index/reload")
def reload_index() -> dict:
    load_faiss_index()
    return {"reloaded": True, "indexedViews": len(index_metadata)}


@app.post("/index/sync-s3")
def sync_index_from_s3(backend_url: Optional[str] = Query(default=None)) -> dict:
    if detector is None or embedder is None:
        raise HTTPException(status_code=503, detail="AI models not initialized")
    try:
        summary = build_index_from_backend_s3(detector, embedder, backend_url=backend_url)
        load_faiss_index()
        return {"synced": True, **summary}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to sync index from S3: {exc}")


@app.post("/recognition/match", response_model=RecognitionResponse)
async def match_landmark(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    candidatesJson: str = Form("[]"),
    gpsAccuracyMeters: Optional[float] = Form(None),
    headingDegrees: Optional[float] = Form(None),
    headingAccuracy: Optional[float] = Form(None),
) -> RecognitionResponse:
    start_ts = time.perf_counter()
    request_id = str(uuid.uuid4())

    if detector is None or embedder is None:
        raise HTTPException(status_code=503, detail="AI models not initialized")

    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates")

    raw_bytes = await image.read()
    if len(raw_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")
    if len(raw_bytes) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds MAX_IMAGE_BYTES")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Unsupported or corrupted image")

    if pil_img.width > settings.max_image_width or pil_img.height > settings.max_image_height:
        pil_img.thumbnail((settings.max_image_width, settings.max_image_height), Image.Resampling.LANCZOS)

    try:
        raw_candidates = json.loads(candidatesJson)
        geo_candidates = [GeoCandidate(**item) for item in raw_candidates]
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid candidatesJson: {exc}")

    # Якщо індекс ще порожній при першому запиті — пробуємо підтягнути його автоматично
    if (faiss_index is None or faiss_index.ntotal == 0) and geo_candidates:
        try:
            build_index_from_backend_s3(detector, embedder)
            load_faiss_index()
        except Exception as exc:
            logger.warning("Lazy S3 index sync failed: %s", exc)

    # 1. Детекція об'єкта та ROI cropping
    roi_img, detection_fallback, _ = detector.detect_and_crop(pil_img)

    # 2. Побудова DINOv2 embedding
    query_vec = embedder.get_embedding(roi_img).reshape(1, -1)

    # 3. Пошук у FAISS (тільки серед nearby кандидатів)
    visual_matches: Dict[int, Tuple[float, str]] = {}
    candidate_ids = {c.landmarkId for c in geo_candidates}

    if faiss_index is not None and faiss_index.ntotal > 0 and candidate_ids:
        top_k = min(30, faiss_index.ntotal)
        scores, indices = faiss_index.search(query_vec, top_k)

        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(index_metadata):
                continue
            meta = index_metadata[idx]
            lid = int(meta["landmarkId"])
            if lid not in candidate_ids:
                continue
            sim = float(score)
            if lid not in visual_matches or sim > visual_matches[lid][0]:
                visual_matches[lid] = (sim, meta.get("viewId", ""))

    # 4. Комбінований reranking (visual + geo + heading)
    status, best_match, all_scored = rerank_candidates(
        geo_candidates=geo_candidates,
        visual_matches_by_landmark=visual_matches,
        gps_accuracy_meters=gpsAccuracyMeters,
        heading_degrees=headingDegrees,
        heading_accuracy=headingAccuracy,
        detection_fallback=detection_fallback,
    )

    elapsed_ms = int((time.perf_counter() - start_ts) * 1000)
    return RecognitionResponse(
        status=status,
        requestId=request_id,
        bestMatch=best_match,
        candidates=all_scored,
        detectionFallback=detection_fallback,
        modelVersion=settings.model_version,
        processingMs=elapsed_ms,
    )