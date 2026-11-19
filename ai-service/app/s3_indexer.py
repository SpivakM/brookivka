import io
import json
import os
import urllib.request
from typing import Dict, List, Optional

import faiss
import numpy as np
from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.detector import ObjectDetector
from app.embedder import DinoEmbedder


def _fetch_json(url: str, timeout: int = 15) -> list:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _download_image_to_ram(url: str, timeout: int = 15) -> Image.Image:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Brookivka-AI-Indexer/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return Image.open(io.BytesIO(raw)).convert("RGB")


def build_index_from_backend_s3(
    detector: ObjectDetector,
    embedder: DinoEmbedder,
    backend_url: Optional[str] = None,
) -> Dict[str, object]:
    """
    Отримує список пам'яток із публічними S3/CDN photoUrl із бекенду (/api/landmarks/nearby),
    завантажує фото у RAM, будує DINOv2-ембеддінги та зберігає FAISS-індекс.
    """
    base = (backend_url or settings.effective_backend_url).rstrip("/")
    api_url = f"{base}/api/landmarks/nearby?lat=49.8415&lng=24.0310&radius=50000"
    landmarks = _fetch_json(api_url)

    vectors: List[np.ndarray] = []
    metadata: List[dict] = []
    errors: List[dict] = []

    for item in landmarks:
        landmark_id = item.get("id")

        # Підтримуємо як одиночне photoUrl, так і майбутній масив photoUrls
        urls: List[str] = []
        if isinstance(item.get("photoUrls"), list):
            urls.extend([u.strip() for u in item["photoUrls"] if isinstance(u, str) and u.strip()])
        single_url = (item.get("photoUrl") or "").strip()
        if single_url and single_url not in urls:
            urls.append(single_url)

        if not landmark_id or not urls:
            continue

        for idx, photo_url in enumerate(urls):
            try:
                pil_img = _download_image_to_ram(photo_url)

                if pil_img.width > settings.max_image_width or pil_img.height > settings.max_image_height:
                    pil_img.thumbnail(
                        (settings.max_image_width, settings.max_image_height),
                        Image.Resampling.LANCZOS,
                    )

                roi_img, used_fallback, _ = detector.detect_and_crop(pil_img)
                embedding = embedder.get_embedding(roi_img)

                vectors.append(embedding)
                metadata.append(
                    {
                        "landmarkId": int(landmark_id),
                        "viewId": f"s3_view_{idx + 1}",
                        "sourceUrl": photo_url,
                        "detectionFallback": used_fallback,
                    }
                )
            except (UnidentifiedImageError, Exception) as exc:
                errors.append({"landmarkId": landmark_id, "url": photo_url, "error": str(exc)})

    os.makedirs(os.path.dirname(settings.faiss_index_path), exist_ok=True)
    os.makedirs(os.path.dirname(settings.faiss_metadata_path), exist_ok=True)

    index = faiss.IndexFlatIP(settings.embedding_dimension)
    if vectors:
        matrix = np.vstack(vectors).astype(np.float32)
        index.add(matrix)

    faiss.write_index(index, settings.faiss_index_path)
    with open(settings.faiss_metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    return {
        "indexedViews": len(metadata),
        "totalFetchedFromBackend": len(landmarks),
        "sourceBackend": base,
        "errors": errors,
    }