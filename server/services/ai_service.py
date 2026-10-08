"""
AI Service — Gemini Vision & Multimodal Form Analysis Integration.
Handles business logic and surfaces user-friendly AI processing errors.
"""

import json
import logging
from pathlib import Path

from config import AI_MODEL_NAME, GEMINI_API_KEY
from google import genai
from google.genai.errors import APIError
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class AIProcessingError(Exception):
    """Custom exception for user-facing Gemini API and Form Analysis business errors."""


# --------------------------------------------------------------------------
# Pydantic Schemas for Gemini Structured JSON Output
# --------------------------------------------------------------------------
class FieldInfo(BaseModel):
    id: str = Field(description="Unique field identifier, e.g. f1, f2, f3...")
    name: str = Field(
        description="Short, human-readable name of the field, e.g. Full Name of Applicant"
    )
    originalText: str = Field(
        description="Exact verbatim text or label printed on the form"
    )
    type: str = Field(
        description="Field input category, e.g. Personal Text, Date, Address, Currency, Government ID, Selection, Signature"
    )
    isMandatory: bool = Field(
        description="True if this field is mandatory/required to be filled, False if optional"
    )
    meaning: str = Field(
        description="Clear, jargon-free plain English explanation of what this field asks for and how to fill it"
    )
    format: str = Field(
        description="Expected input format, e.g. DD/MM/YYYY, ALL CAPS, 10-digit number"
    )
    example: str = Field(
        description="A realistic sample entry, e.g. ROHIT KUMAR SHARMA"
    )
    docRequired: str | None = Field(
        default=None,
        description="Name of supporting document required for this field, e.g. Domicile Certificate, or null if none",
    )
    pitfalls: list[str] = Field(
        default_factory=list,
        description="Common mistakes or pitfalls to avoid when filling this field",
    )


class DocumentRequirement(BaseModel):
    id: str = Field(description="Unique document ID, e.g. d1, d2...")
    name: str = Field(
        description="Name of supporting document to attach, e.g. State Domicile Certificate"
    )
    desc: str = Field(
        description="Brief explanation of why it is needed and who issues it"
    )
    isMandatory: bool = Field(
        description="True if mandatory attachment, False if optional"
    )


class ActionRequirement(BaseModel):
    id: str = Field(description="Unique action ID, e.g. a1, a2...")
    name: str = Field(
        description="Name of action required, e.g. Institutional Verification Stamp"
    )
    desc: str = Field(
        description="Brief instruction on who must sign or execute this action"
    )


class WizardStep(BaseModel):
    num: int = Field(description="Step sequence number starting from 1")
    title: str = Field(description="Short step title, e.g. Gather Revenue Certificates")
    desc: str = Field(description="Clear instruction detailing what to do in this step")


class FormAnalysisSchema(BaseModel):
    id: str = Field(description="Unique form analysis session identifier")
    title: str = Field(
        description="Official main title of the form detected from the document"
    )
    category: str = Field(
        description="Category classification, e.g. Education & Financial Aid, Government Residency, Tax Declaration"
    )
    complexity: str = Field(
        description="Estimated form difficulty level: Easy, Medium, or Hard"
    )
    totalFields: int = Field(description="Total number of fields identified")
    fields: list[FieldInfo] = Field(description="Detailed list of form fields")
    documents: list[DocumentRequirement] = Field(
        description="Aggregated list of required supporting document attachments"
    )
    actions: list[ActionRequirement] = Field(
        description="Aggregated list of required signatures, stamps, and declarations"
    )
    steps: list[WizardStep] = Field(
        description="Sequential 4 to 6 step completion sequence"
    )


SYSTEM_PROMPT = """
You are FormGuide.AI, an expert AI assistant specializing in form understanding, legal jargon translation, and document requirement analysis.

Analyze the uploaded form document (PDF or image) and generate a structured representation detailing:
1. Every individual form field, checkbox, entry box, and section.
2. For each field:
   - Translate confusing legal, official, or bureaucratic wording into simple, conversational, plain-language English.
   - Specify the exact expected format and provide realistic, helpful example entries.
   - Identify if a supporting document (certificate, ID, proof) is required for that field.
   - List common mistakes or pitfalls users often make.
3. Aggregate a master list of all required supporting documents to attach.
4. Aggregate all required signatures, stamps, notary affidavits, or declarations.
5. Provide a clear, chronological 4 to 6 step completion wizard guiding the user from preparation to submission.

Be thorough, precise, compassionate, and easy to understand.
"""


def analyze_form_document(file_path_str: str, session_id: str) -> dict:
    """
    Direct processing path for AI Form Analysis.
    Surfaces clean, business-level errors for API key issues or Gemini API failures.
    """
    if not GEMINI_API_KEY or not GEMINI_API_KEY.strip():
        raise AIProcessingError(
            "GEMINI_API_KEY is not configured on the server. Please add a valid GEMINI_API_KEY to server/.env"
        )

    file_path = Path(file_path_str) if file_path_str else None
    if file_path is None or not file_path.exists():
        raise FileNotFoundError(
            f"Uploaded form file not found for session {session_id}."
        )

    logger.info(
        "Analyzing uploaded form with Gemini Vision API (%s)...", file_path.name
    )
    return _call_gemini_vision_api(file_path, session_id)


def _call_gemini_vision_api(file_path: Path, session_id: str) -> dict:
    """Call Gemini Vision API and catch API errors into clean AIProcessingError messages."""
    try:
        client = genai.Client(api_key=GEMINI_API_KEY.strip())
        uploaded_file = client.files.upload(file=file_path)

        config = genai.types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=FormAnalysisSchema,
            temperature=0.2,
        )

        response = client.models.generate_content(
            model=AI_MODEL_NAME, contents=[uploaded_file], config=config
        )

        raw_json = response.text
        if not raw_json:
            raise AIProcessingError("Gemini Vision API returned an empty response.")

        parsed_data = json.loads(raw_json)
        parsed_data["id"] = session_id

        return {"status": "success", "session_id": session_id, "form_data": parsed_data}

    except APIError as api_err:
        logger.exception("Gemini API Error:")
        # Extract clean human-readable error message without leaking internal tracebacks
        msg = getattr(api_err, "message", str(api_err))
        if "API_KEY_INVALID" in str(api_err) or "API key not valid" in msg:
            raise AIProcessingError(
                "Gemini API key is invalid. Please check the GEMINI_API_KEY in server/.env"
            ) from api_err
        raise AIProcessingError(f"Gemini API Error: {msg}") from api_err

    except json.JSONDecodeError as json_err:
        logger.exception("Failed to parse Gemini output JSON:")
        raise AIProcessingError(
            "Failed to parse form analysis output from Gemini response."
        ) from json_err

    except Exception as e:
        if isinstance(e, (AIProcessingError, FileNotFoundError, ValueError)):
            raise
        logger.exception("Unexpected error in Gemini Vision API integration:")
        raise AIProcessingError(
            "An error occurred while analyzing the document with Gemini Vision API."
        ) from e
