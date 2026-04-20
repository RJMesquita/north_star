"""Speaker anonymization helpers."""

from __future__ import annotations

import hashlib
import re

from faker import Faker


FAKER_LOCALE = "en_US"


def anonymize_speaker_name(name: str) -> str:
    """Return a deterministic fake full name for a real speaker name."""

    normalized_name = name.strip()
    if not normalized_name:
        return ""

    digest = hashlib.sha256(normalized_name.lower().encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], byteorder="big", signed=False)
    faker = Faker(FAKER_LOCALE)
    faker.seed_instance(seed)
    return f"{faker.first_name()} {faker.last_name()}"


def anonymize_speakers_text(value: str) -> str:
    """Replace all speaker names in a speaker field with deterministic fakes."""

    normalized_value = re.sub(r"\s+(and|&)\s+", ",", value, flags=re.IGNORECASE)
    speakers = [
        speaker.strip()
        for speaker in re.split(r"[,;|]+", normalized_value)
        if speaker.strip()
    ]
    if not speakers:
        return value
    return ", ".join(anonymize_speaker_name(speaker) for speaker in speakers)
