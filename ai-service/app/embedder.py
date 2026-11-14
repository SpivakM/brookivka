import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel
from app.config import settings


class DinoEmbedder:
    def __init__(self) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoImageProcessor.from_pretrained(settings.embedding_model)
        self.model = AutoModel.from_pretrained(settings.embedding_model).to(self.device)
        self.model.eval()

    @torch.no_grad()
    def get_embedding(self, image: Image.Image) -> np.ndarray:
        rgb_image = image.convert("RGB")
        inputs = self.processor(images=rgb_image, return_tensors="pt").to(self.device)
        outputs = self.model(**inputs)

        # CLS-токен DINOv2 (розмірність 768 для dinov2-base)
        cls_embedding = outputs.last_hidden_state[:, 0, :].squeeze(0).cpu().numpy().astype("float32")

        # L2-нормалізація для cosine similarity через Inner Product у FAISS
        norm = np.linalg.norm(cls_embedding)
        if norm > 0:
            cls_embedding = cls_embedding / norm
        return cls_embedding