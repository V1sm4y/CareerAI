"""PDF text extraction using pdfminer.six."""
import io
from typing import Optional
from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams


def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """
    Extract plain text from a PDF file.

    Args:
        file_bytes: Raw bytes of the uploaded PDF.

    Returns:
        Extracted text string, or None if extraction fails.
    """
    try:
        pdf_stream = io.BytesIO(file_bytes)
        laparams = LAParams(line_overlap=0.5, word_margin=0.1)
        text = extract_text(pdf_stream, laparams=laparams)
        return text.strip() if text else None
    except Exception as exc:
        print(f"[resume_parser] PDF extraction failed: {exc}")
        return None
