import os
import webbrowser
import threading
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.api.endpoints import router as api_router

# Ensure DB tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Biomedical Waste Detection, Segregation, Tracking & Collection OS"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
UPLOADS_DIR = Path(settings.BASE_DIR) / "backend" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Mount API endpoints under /api
app.include_router(api_router, prefix=settings.API_V1_STR)


# Mount static frontend build if dist folder exists
FRONTEND_DIST = Path(settings.BASE_DIR) / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve API docs or API routes normally
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"system": settings.PROJECT_NAME, "status": "OPERATIONAL"}
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "tagline": "Don't just classify the waste. Know what you don't know.",
            "core_principle": "AI confidence is NOT operational safety.",
            "version": settings.VERSION,
            "status": "OPERATIONAL"
        }

def open_browser():
    import time
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000/")

if __name__ == "__main__":
    import uvicorn
    # Automatically open default browser to application
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)
