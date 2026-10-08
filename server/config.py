"""
FormGuide AI — Server Configuration
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
CLIENT_DIR = BASE_DIR.parent / "client"
UPLOAD_FOLDER = BASE_DIR / "uploads"

# Ensure upload directory exists
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# Security & Upload Limits
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}

# AI Configuration (Placeholder for Option A)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_MODEL_NAME = os.getenv("AI_MODEL_NAME", "gemini-2.0-flash")
USE_MOCK_AI = os.getenv("USE_MOCK_AI", "true").lower() == "true"
