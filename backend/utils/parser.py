"""
Document parsers — PDF, DOCX, TXT.
"""

from pathlib import Path
import fitz  # PyMuPDF
from docx import Document as DocxDocument


def parse_pdf(path: str) -> str:
    doc = fitz.open(path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        if text.strip():
            pages.append(f"[Page {i + 1}]\n{text.strip()}")
    return "\n\n".join(pages)


def parse_docx(path: str) -> str:
    doc = DocxDocument(path)
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(lines)


def parse_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def parse_document(path: str) -> str:
    ext = Path(path).suffix.lower()
    parsers = {
        ".pdf": parse_pdf,
        ".docx": parse_docx,
        ".doc": parse_docx,
        ".txt": parse_txt,
        ".md": parse_txt,
    }

    parser = parsers.get(ext)
    if not parser:
        raise ValueError(f"Unsupported file type: {ext}")

    text = parser(path)
    if not text.strip():
        raise ValueError(f"No text extracted from {path}")

    return text