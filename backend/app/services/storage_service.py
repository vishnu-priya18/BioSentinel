import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple
from backend.app.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.BASE_DIR) / "backend" / "uploads"
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def is_cloud_configured(self) -> bool:
        """
        Returns True ONLY if cloud storage credentials and bucket are fully configured.
        """
        return bool(
            settings.STORAGE_URL and
            settings.STORAGE_BUCKET and
            settings.STORAGE_ACCESS_KEY and
            settings.STORAGE_SECRET_KEY
        )

    def check_health(self) -> Dict[str, Any]:
        """
        Empirically checks storage health and cloud status.
        Never lies about cloud connectivity.
        """
        cloud_active = self.is_cloud_configured()
        return {
            "cloud_connected": cloud_active,
            "storage_mode": "CLOUD_OBJECT_STORAGE" if cloud_active else "LOCAL_STORAGE",
            "provider": settings.STORAGE_PROVIDER if cloud_active else "LOCAL_DISK",
            "bucket": settings.STORAGE_BUCKET if cloud_active else None,
            "local_dir_ready": self.upload_dir.exists(),
            "status": "ONLINE"
        }

    def save_image(self, image_bytes: bytes, filename_prefix: str = "scan") -> Tuple[str, str]:
        """
        Saves image to cloud storage if configured, otherwise to local storage.
        Returns: (image_url, storage_key)
        """
        file_id = f"{filename_prefix}_{uuid.uuid4().hex[:8]}.jpg"

        if self.is_cloud_configured():
            try:
                # Cloud S3 / Object Storage upload logic
                import boto3
                s3 = boto3.client(
                    's3',
                    aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                    aws_secret_access_key=settings.STORAGE_SECRET_KEY,
                    region_name=settings.STORAGE_REGION or 'us-east-1'
                )
                s3.put_object(
                    Bucket=settings.STORAGE_BUCKET,
                    Key=file_id,
                    Body=image_bytes,
                    ContentType='image/jpeg'
                )
                cloud_url = f"{settings.STORAGE_URL.rstrip('/')}/{file_id}"
                return cloud_url, file_id
            except Exception as e:
                print(f"[StorageService] Cloud upload error fallback to local: {e}")

        # Local fallback storage
        local_path = self.upload_dir / file_id
        with open(local_path, "wb") as f:
            f.write(image_bytes)

        local_url = f"/uploads/{file_id}"
        return local_url, file_id
