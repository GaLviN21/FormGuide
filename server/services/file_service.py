"""
File Service — Upload validation, session tracking, and PDF processing utilities.
Template prepared for full implementation in Option A.
"""

import shutil
import uuid

from config import ALLOWED_EXTENSIONS, UPLOAD_FOLDER
from werkzeug.utils import secure_filename


def allowed_file(filename: str) -> bool:
    """Check if uploaded file has a supported extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file_obj) -> dict:
    """
    Save incoming file to session-isolated folder in server/uploads/
    Returns session metadata dict.
    """
    if not file_obj or file_obj.filename == "":
        raise ValueError("No file selected for upload.")

    if not allowed_file(file_obj.filename):
        raise ValueError(
            f"Unsupported file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_FOLDER / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    filename = secure_filename(file_obj.filename)
    saved_path = session_dir / filename
    file_obj.save(saved_path)

    return {
        "session_id": session_id,
        "filename": filename,
        "file_path": str(saved_path),
        "extension": filename.rsplit(".", 1)[1].lower(),
        "size_bytes": saved_path.stat().st_size,
    }


def cleanup_session(session_id: str) -> bool:
    """Delete transient files for a given session."""
    session_dir = UPLOAD_FOLDER / session_id
    if session_dir.exists() and session_dir.is_dir():
        shutil.rmtree(session_dir)
        return True
    return False
