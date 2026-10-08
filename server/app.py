"""
FormGuide AI — Flask Backend Application Server
"""

import logging

from config import CLIENT_DIR, MAX_CONTENT_LENGTH
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from services.ai_service import analyze_form_document
from services.file_service import (
    cleanup_session,
    get_session_file_path,
    save_uploaded_file,
)

app = Flask(__name__, static_folder=str(CLIENT_DIR))
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Enable CORS for frontend API access
CORS(app)

# Logger setup
logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# Centralized Error Handlers (Flask Global Exception Handling)
# --------------------------------------------------------------------------
@app.errorhandler(Exception)
def handle_global_exception(error):
    """
    Global exception handler for unhandled 500 server errors.
    Eliminates the need for repetitive try/except 500 blocks in individual routes.
    """
    logger.error("Global Exception Caught: %s", error, exc_info=True)
    response = {
        "status": "error",
        "error": "Internal Server Error",
        "details": str(error),
    }
    return jsonify(response), 500


@app.errorhandler(413)
def request_entity_too_large(_):
    """Handler for payload exceeding file size limit."""
    return jsonify({"status": "error", "error": "File size exceeds 16 MB limit."}), 413


@app.errorhandler(404)
def resource_not_found(_):
    """Handler for 404 missing resource."""
    return jsonify(
        {"status": "error", "error": "Requested endpoint or asset not found."}
    ), 404


# --------------------------------------------------------------------------
# Static Client Routes (Serves Light Theme Frontend)
# --------------------------------------------------------------------------
@app.route("/")
def index():
    """Serve main frontend HTML interface."""
    return send_from_directory(CLIENT_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve client static assets (CSS, JS, images)."""
    return send_from_directory(CLIENT_DIR, filename)


# --------------------------------------------------------------------------
# REST API Endpoints
# --------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """System health check endpoint."""
    return jsonify(
        {"status": "healthy", "service": "FormGuide.AI Backend", "version": "1.0.0"}
    )


@app.route("/api/upload", methods=["POST"])
def upload_file():
    """
    POST /api/upload
    Receives PDF or Image file, validates, and stores in session folder.
    """
    if "file" not in request.files:
        return jsonify({"status": "error", "error": "No file payload in request"}), 400

    file_obj = request.files["file"]
    try:
        session_data = save_uploaded_file(file_obj)
        return jsonify(
            {
                "status": "success",
                "message": "File uploaded successfully.",
                "session_id": session_data["session_id"],
                "filename": session_data["filename"],
                "size_bytes": session_data["size_bytes"],
            }
        ), 200
    except ValueError as ve:
        return jsonify({"status": "error", "error": str(ve)}), 400


@app.route("/api/analyze", methods=["POST"])
def analyze_form():
    """
    POST /api/analyze
    Payload: { "session_id": "string" }
    Triggers AI layout & field understanding extraction via Gemini Vision API.
    """
    data = request.get_json() or {}
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"status": "error", "error": "session_id is required"}), 400

    file_path = get_session_file_path(session_id)
    file_path_str = str(file_path) if file_path else ""

    analysis_result = analyze_form_document(
        file_path_str=file_path_str, session_id=session_id
    )
    return jsonify(analysis_result), 200


@app.route("/api/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Clean up uploaded files for a session."""
    success = cleanup_session(session_id)
    return jsonify({"status": "cleaned" if success else "not_found"}), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
