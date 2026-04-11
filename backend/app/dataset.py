"""Workbook loading and session normalization utilities."""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path
import re
from typing import Any

import pandas as pd

from app.models import FilterOptions, SessionRecord


DATA_FILE_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "data-makers-fest-2026.xlsx"
)


class DatasetLoadError(RuntimeError):
    """Raised when the conference workbook cannot be loaded or parsed."""


def _clean_text(value: Any) -> str:
    """Return a stripped string for workbook values.

    Args:
        value: Raw value from a dataframe cell.

    Returns:
        A normalized string, or an empty string for missing values.
    """

    if value is None:
        return ""
    if pd.isna(value):
        return ""
    return str(value).strip()


def _parse_datetime(value: Any) -> datetime | None:
    """Parse a workbook timestamp into a Python datetime.

    Args:
        value: Raw timestamp-like value from the workbook.

    Returns:
        A parsed datetime, or None when parsing is not possible.
    """

    if value is None or pd.isna(value):
        return None

    if isinstance(value, datetime):
        return value

    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.to_pydatetime()


def _parse_duration_minutes(value: Any) -> int | None:
    """Parse a workbook duration into minutes.

    Args:
        value: Raw duration value from the workbook.

    Returns:
        Duration in minutes, or None when unavailable.
    """

    if value is None or pd.isna(value):
        return None

    if isinstance(value, timedelta):
        return max(1, int(value.total_seconds() // 60))

    if hasattr(value, "hour") and hasattr(value, "minute") and hasattr(value, "second"):
        total_seconds = (value.hour * 3600) + (value.minute * 60) + value.second
        return max(1, total_seconds // 60)

    if isinstance(value, (int, float)):
        if value <= 0:
            return None
        if value < 1:
            return max(1, int(round(value * 24 * 60)))
        return int(round(value))

    text_value = _clean_text(value)
    if not text_value:
        return None

    time_parts = text_value.split(":")
    if len(time_parts) >= 2 and all(part.isdigit() for part in time_parts[:2]):
        hours = int(time_parts[0])
        minutes = int(time_parts[1])
        return max(1, (hours * 60) + minutes)

    digits = "".join(char for char in text_value if char.isdigit())
    if digits:
        return int(digits)
    return None


def _build_search_document(
    title: str,
    description: str,
    track: str,
    talk_type: str,
    level: str,
    keywords: str,
) -> str:
    """Combine session text fields into a TF-IDF search document."""

    parts = [title, description, track, talk_type, level, keywords]
    return " ".join(part for part in parts if part)


def _split_keywords(value: str) -> list[str]:
    """Split a dataset keyword field into individual keyword options."""

    return [
        keyword.strip()
        for keyword in re.split(r"[,;|/]+", value)
        if keyword.strip()
    ]


def _split_speakers(value: str) -> list[str]:
    """Split a session speaker field into individual speaker names."""

    normalized_value = re.sub(r"\s+(and|&)\s+", ",", value, flags=re.IGNORECASE)
    return [
        speaker.strip()
        for speaker in re.split(r"[,;|]+", normalized_value)
        if speaker.strip()
    ]


def load_sessions(data_file_path: Path = DATA_FILE_PATH) -> list[SessionRecord]:
    """Load and normalize sessions from the conference workbook.

    Args:
        data_file_path: Absolute path to the conference workbook.

    Returns:
        A list of normalized session records.

    Raises:
        DatasetLoadError: If the workbook is missing or malformed.
    """

    if not data_file_path.exists():
        raise DatasetLoadError(f"Conference workbook not found at {data_file_path}.")

    try:
        sessions_df = pd.read_excel(
            data_file_path,
            sheet_name="Accepted sessions",
        )
    except Exception as exc:
        raise DatasetLoadError("Unable to read the Accepted sessions sheet.") from exc

    sessions: list[SessionRecord] = []
    for _, row in sessions_df.iterrows():
        title = _clean_text(row.get("Title"))
        description = _clean_text(row.get("Description"))
        track = _clean_text(row.get("Track"))
        talk_type = _clean_text(row.get("Type of Talk"))
        level = _clean_text(row.get("Level of talk"))
        keywords = _clean_text(row.get("Keywords"))
        scheduled_at = _parse_datetime(row.get("Scheduled At"))
        duration_minutes = _parse_duration_minutes(row.get("Scheduled Duration"))
        ends_at = None
        if scheduled_at is not None and duration_minutes is not None:
            ends_at = scheduled_at + timedelta(minutes=duration_minutes)

        sessions.append(
            SessionRecord(
                session_id=_clean_text(row.get("Session Id")),
                title=title,
                description=description,
                speakers=_clean_text(row.get("Speakers")),
                track=track,
                talk_type=talk_type,
                level=level,
                keywords=keywords,
                scheduled_at=scheduled_at,
                ends_at=ends_at,
                duration_minutes=duration_minutes,
                search_document=_build_search_document(
                    title=title,
                    description=description,
                    track=track,
                    talk_type=talk_type,
                    level=level,
                    keywords=keywords,
                ),
            )
        )

    return sessions


def build_filter_options(sessions: list[SessionRecord]) -> FilterOptions:
    """Build distinct UI filter options from normalized sessions.

    Args:
        sessions: Normalized session records.

    Returns:
        Distinct track, talk type, and level values.
    """

    return FilterOptions(
        tracks=sorted({session.track for session in sessions if session.track}),
        talk_types=sorted(
            {session.talk_type for session in sessions if session.talk_type}
        ),
        levels=sorted({session.level for session in sessions if session.level}),
        keywords=sorted(
            {
                keyword
                for session in sessions
                for keyword in _split_keywords(session.keywords)
            }
        ),
        speakers=sorted(
            {
                speaker
                for session in sessions
                for speaker in _split_speakers(session.speakers)
            }
        ),
    )
