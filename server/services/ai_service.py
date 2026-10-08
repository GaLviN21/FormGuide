"""
AI Service — Gemini Vision & Multimodal Form Analysis Integration.
Template prepared for full LLM API wiring in Option A.
"""

import logging

from config import GEMINI_API_KEY, USE_MOCK_AI

logger = logging.getLogger(__name__)


def analyze_form_document(file_path: str, session_id: str) -> dict:
    """
    Main entry point for AI Form Analysis.
    In Option A, this will invoke Gemini Multimodal Vision API with a strict JSON schema.
    Currently returns a structured response matching ConcretePlan.md specifications.
    """
    if not USE_MOCK_AI and GEMINI_API_KEY:
        return _call_gemini_vision_api(file_path)

    # Fallback / Template Mock Data Generator
    return _get_mock_analysis_payload(session_id)


def _call_gemini_vision_api(file_path: str) -> dict:
    """
    [OPTION A PLACEHOLDER]
    Real Gemini Multimodal API invocation logic will be filled here.
    """
    raise NotImplementedError(
        "Real Gemini Vision API call will be connected when Option A is initiated."
    )


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
