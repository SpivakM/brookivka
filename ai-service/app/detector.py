from typing import Tuple
import numpy as np
from PIL import Image
from ultralytics import YOLO
from app.config import settings


class ObjectDetector:
    def __init__(self) -> None:
        self.model = YOLO(settings.detection_model)

    def detect_and_crop(self, image: Image.Image) -> Tuple[Image.Image, bool, float]:
        """
        Повертає: (cropped_pil_image, detection_fallback, best_confidence)
        """
        img_np = np.array(image)
        h, w = img_np.shape[:2]

        results = self.model.predict(
            source=img_np,
            conf=settings.detection_confidence_threshold,
            verbose=False,
        )

        if not results or len(results[0].boxes) == 0:
            return image, True, 0.0

        boxes = results[0].boxes
        best_idx = None
        best_score = -1.0

        for i in range(len(boxes)):
            xyxy = boxes.xyxy[i].cpu().numpy()
            conf = float(boxes.conf[i].cpu().numpy())
            area_ratio = ((xyxy[2] - xyxy[0]) * (xyxy[3] - xyxy[1])) / float(w * h)

            # Відкидаємо крихітний шум (< 2% площі кадру)
            if area_ratio < 0.02:
                continue

            # Пріоритет великому об'єкту в центрі кадру з високим confidence
            score = conf * (0.5 + 0.5 * min(area_ratio * 2.0, 1.0))
            if score > best_score:
                best_score = score
                best_idx = i

        if best_idx is None:
            return image, True, 0.0

        x1, y1, x2, y2 = boxes.xyxy[best_idx].cpu().numpy()
        conf = float(boxes.conf[best_idx].cpu().numpy())

        # Розширюємо ROI на 10% для збереження контексту фасаду
        pad_x = (x2 - x1) * 0.10
        pad_y = (y2 - y1) * 0.10

        crop_x1 = max(0, int(x1 - pad_x))
        crop_y1 = max(0, int(y1 - pad_y))
        crop_x2 = min(w, int(x2 + pad_x))
        crop_y2 = min(h, int(y2 + pad_y))

        cropped = image.crop((crop_x1, crop_y1, crop_x2, crop_y2))
        return cropped, False, conf