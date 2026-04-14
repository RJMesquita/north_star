"""Speaker anonymization helpers."""

from __future__ import annotations

import hashlib
import re


FAKE_FIRST_NAMES = [
    "Alex",
    "Avery",
    "Blair",
    "Cameron",
    "Casey",
    "Devon",
    "Emerson",
    "Finley",
    "Harper",
    "Jordan",
    "Kai",
    "Logan",
    "Morgan",
    "Parker",
    "Quinn",
    "Reese",
    "Riley",
    "Sage",
    "Taylor",
    "Rowan",
]

FAKE_LAST_NAMES = [
    "Ashford",
    "Bennett",
    "Calloway",
    "Delaney",
    "Ellison",
    "Fairchild",
    "Granger",
    "Hollis",
    "Iverson",
    "Jamison",
    "Kingsley",
    "Langley",
    "Marlowe",
    "North",
    "Oakley",
    "Prescott",
    "Ramsey",
    "Sterling",
    "Winslow",
    "York",
]


def anonymize_speaker_name(name: str) -> str:
    """Return a deterministic fake full name for a real speaker name."""

    normalized_name = name.strip()
    if not normalized_name:
        return ""

    digest = hashlib.sha256(normalized_name.lower().encode("utf-8")).digest()
    first_name = FAKE_FIRST_NAMES[digest[0] % len(FAKE_FIRST_NAMES)]
    last_name = FAKE_LAST_NAMES[digest[1] % len(FAKE_LAST_NAMES)]
    suffix = (digest[2] % 97) + 1
    return f"{first_name} {last_name} {suffix}"


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
