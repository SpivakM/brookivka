import json
import os
import sys
from pathlib import Path

import faiss
import numpy as np
from PIL import Image

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.config import settings
from app.embedder import DinoEmbedder

BASE_DIR = Path(__file__).resolve().parent.parent
REF_DIR = BASE_DIR / "data" / "reference-images"
INDEX_DIR = BASE_DIR / "data" / "index"
MANIFEST_PATH = BASE_DIR / "data" / "manifests" / "manifest.json"


def discover_images() -> list[dict]:
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    items = []
    if not REF_DIR.exists():
        return items

    for folder in sorted(REF_DIR.iterdir()):
        if not folder.is_dir() or not folder.name.startswith("landmark-"):
            continue
        try:
            landmark_id = int(folder.name.split("-")[1])
        except (IndexError, ValueError):
            continue

        for img_file in sorted(folder.iterdir()):
            if img_file.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                items.append(
                    {
                        "viewId": f"landmark-{landmark_id}-{img_file.stem}",
                        "landmarkId": landmark_id,
                        "imagePath": f"{folder.name}/{img_file.name}",
                    }
                )
    return items


def main() -> None:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    items = discover_images()

    if not items:
        print(f"No reference images found in {REF_DIR}. Add images to landmark-<id>/ folders first.")
        return

    embedder = DinoEmbedder()
    vectors = []
    valid_metadata = []

    for entry in items:
        img_path = REF_DIR / entry["imagePath"]
        if not img_path.exists():
            print(f"Skipping missing file: {img_path}")
            continue
        with Image.open(img_path) as img:
            vec = embedder.get_embedding(img)
            vectors.append(vec)
            valid_metadata.append(entry)
            print(f"Indexed {entry['viewId']} -> landmarkId={entry['landmarkId']}")

    if not vectors:
        print("No valid vectors generated.")
        return

    matrix = np.vstack(vectors).astype("float32")
    index = faiss.IndexFlatIP(matrix.shape[1])
    index.add(matrix)

    faiss.write_index(index, str(INDEX_DIR / "landmarks.faiss"))
    with open(INDEX_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(valid_metadata, f, ensure_ascii=False, indent=2)

    print(f"Successfully built FAISS index with {len(valid_metadata)} views.")


if __name__ == "__main__":
    main()