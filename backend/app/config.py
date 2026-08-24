import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Windows OpenMP Fix
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

BASE_PATH = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "BIO SENTINEL-X"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "biosentinelx_secret_key_super_secure_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    BASE_DIR: str = str(BASE_PATH)

    # Database Configuration (Cloud DB or SQLite fallback)
    DATABASE_URL: str = f"sqlite:///{BASE_PATH}/biosentinel.db"

    # Cloud Storage Configuration
    STORAGE_PROVIDER: str = "LOCAL" # S3, AZURE, SUPABASE, or LOCAL
    STORAGE_URL: str = ""
    STORAGE_BUCKET: str = ""
    STORAGE_REGION: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""

    # ML Config
    ML_MODEL_DIR: str = str(BASE_PATH / "backend" / "ml" / "models")
    ML_MODEL_FILE: str = "best.pt"
    ML_CONFIDENCE_THRESHOLD: float = 0.50
    ML_VERIFICATION_THRESHOLD: float = 0.85

    # Hardware Adapter Toggles
    SIMULATE_HARDWARE: bool = True

    class Config:
        case_sensitive = True

settings = Settings()

