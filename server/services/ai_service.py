"""
AI Service — Gemini Vision & Multimodal Form Analysis Integration.
"""

import json
import logging
from pathlib import Path

from config import AI_MODEL_NAME, GEMINI_API_KEY, USE_MOCK_AI
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


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


def get_mime_type(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if ext == ".pdf":
        return "application/pdf"
    elif ext == ".png":
        return "image/png"
    elif ext in [".jpg", ".jpeg"]:
        return "image/jpeg"
    elif ext == ".webp":
        return "image/webp"
    return "application/octet-stream"


def analyze_form_document(file_path_str: str, session_id: str) -> dict | None:
    """
    Main entry point for AI Form Analysis.
    Invokes Gemini Multimodal Vision API when GEMINI_API_KEY is configured and file exists.
    Falls back gracefully to structured mock generator when key is missing or for test files.
    """
    file_path = Path(file_path_str) if file_path_str else None
    if file_path is None or not file_path.exists():
        logger.warning(
            "File path is missing or does not exist for session %s.",
            session_id,
        )
        return None

    if not USE_MOCK_AI and GEMINI_API_KEY:
        try:
            logger.info("Analyzing form with Gemini Vision API (%s)...", file_path.name)
            return _call_gemini_vision_api(file_path, session_id)
        except Exception as e:
            logger.error(
                "Gemini Vision API call failed: %s. Falling back to structured mock response.",
                e,
            )

    logger.info("Using mock fallback analysis for session %s.", session_id)
    return _get_mock_analysis_payload(session_id)


def _call_gemini_vision_api(file_path: Path, session_id: str) -> dict:
    """Call Gemini 2.0 Flash Vision API using google-genai SDK."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    mime_type = get_mime_type(file_path)

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        response_mime_type="application/json",
        response_schema=FormAnalysisSchema,
        temperature=0.2,
    )

    response = client.models.generate_content(
        model=AI_MODEL_NAME, contents=[part], config=config
    )

    raw_json = response.text
    parsed_data = json.loads(raw_json) if raw_json else {}
    parsed_data["id"] = session_id

    return {"session_id": session_id, "form_data": parsed_data}


def _get_mock_analysis_payload(session_id: str) -> dict:
    """Structured mock JSON response conforming to ConcretePlan.md schema."""
    return {
        "session_id": session_id,
        "form_data": {
            "id": "form_analyzed_" + session_id[:8],
            "title": "State Post-Matric Scholarship Application Form 2026",
            "category": "Education & Financial Aid",
            "complexity": "Medium",
            "totalFields": 4,
            "fields": [
                {
                    "id": "f1",
                    "name": "Full Name of Applicant",
                    "originalText": "1. Name of Applicant (in block letters): _________________",
                    "type": "Personal Text",
                    "isMandatory": True,
                    "meaning": "Enter your full legal name in CAPITAL letters exactly as shown on your 10th Passing Certificate.",
                    "format": "FIRSTNAME MIDDLENAME LASTNAME",
                    "example": "ROHIT KUMAR SHARMA",
                    "docRequired": "10th Passing Certificate",
                    "pitfalls": [
                        "Spelling must match Aadhaar card character-for-character."
                    ],
                },
                {
                    "id": "f2",
                    "name": "Domicile Status & State Residency",
                    "originalText": "2. Domicile Status: [ ] Permanent Resident [ ] Migrant",
                    "type": "Residency Selection",
                    "isMandatory": True,
                    "meaning": "Select whether you are an official permanent resident of the state. Requires a Domicile Certificate issued by Tehsildar.",
                    "format": "Checkbox + Certificate Ref No.",
                    "example": "Permanent Resident (Cert: DOM/2025/9912)",
                    "docRequired": "State Domicile Certificate",
                    "pitfalls": [
                        "Hostel or rental addresses do not qualify as permanent domicile."
                    ],
                },
                {
                    "id": "f3",
                    "name": "Annual Family Income",
                    "originalText": "3. Parents Income from all sources: Rs. _____________",
                    "type": "Financial Currency",
                    "isMandatory": True,
                    "meaning": "Total combined yearly income earned by both parents during the previous financial year.",
                    "format": "Numeric INR Amount",
                    "example": "Rs. 1,80,000 / Year",
                    "docRequired": "Revenue Department Income Certificate",
                    "pitfalls": [
                        "Must be below Rs 2,50,000/year for scholarship eligibility."
                    ],
                },
                {
                    "id": "f4",
                    "name": "Aadhaar UID Number",
                    "originalText": "4. Aadhaar Card No: ____-____-____",
                    "type": "Government ID",
                    "isMandatory": True,
                    "meaning": "Your 12-digit national identification number. Bank account must be seeded with Aadhaar for DBT transfer.",
                    "format": "12-digit Number",
                    "example": "4589-1234-9876",
                    "docRequired": "Aadhaar Card Copy",
                    "pitfalls": [
                        "Ensure NPCI seeding status is ACTIVE at your bank branch."
                    ],
                },
            ],
            "documents": [
                {
                    "id": "d1",
                    "name": "State Domicile Certificate",
                    "desc": "Proof of residence issued by Tehsildar.",
                    "isMandatory": True,
                },
                {
                    "id": "d2",
                    "name": "Income Certificate (Current FY)",
                    "desc": "Issued by Revenue Department showing income < 2.5 Lakhs.",
                    "isMandatory": True,
                },
                {
                    "id": "d3",
                    "name": "Aadhaar Passbook Copy",
                    "desc": "Showing A/c number, name, and IFSC code.",
                    "isMandatory": True,
                },
            ],
            "actions": [
                {
                    "id": "a1",
                    "name": "Institutional Verification Stamp",
                    "desc": "Signature of College Principal on Annexure A.",
                }
            ],
            "steps": [
                {
                    "num": 1,
                    "title": "Gather Revenue Certificates",
                    "desc": "Obtain Domicile and Income certificates from government portal.",
                },
                {
                    "num": 2,
                    "title": "Verify Bank NPCI Seeding",
                    "desc": "Confirm your bank account is linked to Aadhaar for Direct Benefit Transfer.",
                },
                {
                    "num": 3,
                    "title": "Fill Details & Attach Signatures",
                    "desc": "Complete form fields and self-attest all photocopy attachments.",
                },
            ],
        },
    }
