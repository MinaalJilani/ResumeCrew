"""
Smart text chunking — section-aware for CVs, sliding window for other docs.
"""

import re

SECTION_HEADERS = re.compile(
    r"^(experience|education|skills|projects|certifications|"
    r"summary|objective|publications|awards|languages|references|"
    r"professional summary|work experience|technical skills|"
    r"achievements|volunteer|interests|training)",
    re.IGNORECASE | re.MULTILINE,
)


def chunk_by_section(text: str, max_chunk_words: int = 400, overlap: int = 80) -> list[dict]:
    """
    Split CV text by section headers (Experience, Education, Skills...).
    Falls back to sliding window for long sections.
    Returns: [{"text": str, "section": str}]
    """
    parts = SECTION_HEADERS.split(text)
    chunks = []
    current_section = "general"

    for part in parts:
        part = part.strip()
        if not part:
            continue

        if SECTION_HEADERS.match(part):
            current_section = part.lower().replace(" ", "_")
            continue

        words = part.split()

        if len(words) <= max_chunk_words:
            if len(words) > 15:  # skip tiny fragments
                chunks.append({"text": part, "section": current_section})
        else:
            # Sliding window for long sections
            i = 0
            while i < len(words):
                window = " ".join(words[i : i + max_chunk_words])
                if len(window.split()) > 15:
                    chunks.append({"text": window, "section": current_section})
                i += max_chunk_words - overlap

    # If no section headers found, chunk the entire text
    if not chunks and text.strip():
        chunks = chunk_free_text(text)

    return chunks


def chunk_free_text(text: str, size: int = 400, overlap: int = 80) -> list[dict]:
    """
    Plain sliding window chunking for non-CV documents.
    Returns: [{"text": str, "section": str}]
    """
    words = text.split()
    chunks = []
    i = 0

    while i < len(words):
        window = " ".join(words[i : i + size])
        if len(window.split()) > 15:
            chunks.append({"text": window, "section": "document"})
        i += size - overlap

    return chunks