from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_service_port: int = 8090
    ai_service_host: str = "0.0.0.0"

    detection_model: str = "yolo11n.pt"
    detection_confidence_threshold: float = 0.25
    embedding_model: str = "facebook/dinov2-base"
    embedding_dimension: int = 768
    model_version: str = "recognition-v1"

    vector_store: str = "faiss"
    faiss_index_path: str = "data/index/landmarks.faiss"
    faiss_metadata_path: str = "data/index/metadata.json"

    max_image_bytes: int = 8388608
    max_image_width: int = 1920
    max_image_height: int = 1920
    inference_timeout_ms: int = 3000

    geo_search_radius_meters: float = 150.0
    visual_weight: float = 0.60
    geo_weight: float = 0.30
    heading_weight: float = 0.10
    match_threshold: float = 0.72
    match_margin_threshold: float = 0.07

    backend_base_url: str = "http://backend:8082"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()