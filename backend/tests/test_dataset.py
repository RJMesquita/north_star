"""Tests for workbook normalization helpers."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from pathlib import Path

import pandas as pd
import pytest

from app.dataset import (
    DatasetLoadError,
    _build_search_document,
    _clean_text,
    _parse_datetime,
    _parse_duration_minutes,
    _split_keywords,
    _split_speakers,
    build_filter_options,
    load_sessions,
)
from app.models import SessionRecord


def test_clean_text_handles_nullish_values() -> None:
    """Missing workbook values should normalize to an empty string."""

    assert _clean_text(None) == ""
    assert _clean_text(float("nan")) == ""
    assert _clean_text(" hello ") == "hello"


def test_parse_datetime_returns_none_for_invalid_values() -> None:
    """Invalid timestamps should not raise and should return None."""

    assert _parse_datetime("not-a-date") is None
    assert _parse_datetime(None) is None


def test_parse_datetime_accepts_strings() -> None:
    """Timestamp-like strings should parse into datetimes."""

    parsed = _parse_datetime("2026-09-10 09:00:00")
    assert parsed == datetime(2026, 9, 10, 9, 0)


@pytest.mark.parametrize(
    ("raw_value", "expected_minutes"),
    [
        (timedelta(minutes=45), 45),
        (time(hour=1, minute=15), 75),
        (0.5, 720),
        (45, 45),
        ("01:30", 90),
        ("45 mins", 45),
    ],
)
def test_parse_duration_minutes_handles_supported_formats(
    raw_value: object,
    expected_minutes: int,
) -> None:
    """Duration parsing should support workbook-friendly formats."""

    assert _parse_duration_minutes(raw_value) == expected_minutes


def test_build_search_document_skips_empty_values() -> None:
    """The vectorization input should not contain blank fragments."""

    document = _build_search_document(
        title="Session",
        description="",
        track="Engineering",
        talk_type="Technical",
        level="",
        keywords="llm",
    )
    assert document == "Session Engineering Technical llm"


def test_build_filter_options_returns_sorted_distinct_values() -> None:
    """Filter extraction should return sorted unique metadata values."""

    sessions = [
        SessionRecord(
            session_id="1",
            title="A",
            description="",
            speakers="",
            track="Engineering",
            talk_type="Technical",
            level="Intermediate",
            keywords="rag, observability",
            scheduled_at=None,
            ends_at=None,
            duration_minutes=None,
            search_document="A",
        ),
        SessionRecord(
            session_id="2",
            title="B",
            description="",
            speakers="",
            track="AI",
            talk_type="Applications",
            level="Beginner",
            keywords="ethics, rag",
            scheduled_at=None,
            ends_at=None,
            duration_minutes=None,
            search_document="B",
        ),
    ]

    filters = build_filter_options(sessions)
    assert filters.tracks == ["AI", "Engineering"]
    assert filters.talk_types == ["Applications", "Technical"]
    assert filters.levels == ["Beginner", "Intermediate"]
    assert filters.keywords == ["ethics", "observability", "rag"]
    assert filters.speakers == []


def test_split_keywords_handles_multiple_delimiters() -> None:
    """Keyword splitting should surface dataset options consistently."""

    assert _split_keywords("rag, eval; tracing | llm") == [
        "rag",
        "eval",
        "tracing",
        "llm",
    ]


def test_split_speakers_handles_common_separators() -> None:
    """Speaker splitting should surface individual speaker names."""

    assert _split_speakers("Jane Doe, Alex Roe and Taylor Poe") == [
        "Jane Doe",
        "Alex Roe",
        "Taylor Poe",
    ]


def test_load_sessions_raises_for_missing_file(tmp_path: Path) -> None:
    """Missing workbooks should raise a dataset-specific error."""

    missing_path = tmp_path / "missing.xlsx"
    with pytest.raises(DatasetLoadError):
        load_sessions(missing_path)


def test_load_sessions_normalizes_rows(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Workbook rows should become normalized session records."""

    workbook_path = tmp_path / "conference.xlsx"
    workbook_path.write_text("placeholder", encoding="utf-8")

    dataframe = pd.DataFrame(
        [
            {
                "Session Id": "S1",
                "Title": "Test Session",
                "Description": "Useful content",
                "Speakers": "Jane Doe",
                "Track": "Engineering",
                "Type of Talk": "Technical",
                "Level of talk": "Intermediate",
                "Keywords": "rag, llm",
                "Scheduled At": "2026-09-10 09:00:00",
                "Scheduled Duration": "00:45",
            }
        ]
    )

    def fake_read_excel(path: Path, sheet_name: str) -> pd.DataFrame:
        assert path == workbook_path
        assert sheet_name == "Accepted sessions"
        return dataframe

    monkeypatch.setattr("app.dataset.pd.read_excel", fake_read_excel)

    sessions = load_sessions(workbook_path)

    assert len(sessions) == 1
    session = sessions[0]
    assert session.session_id == "S1"
    assert session.duration_minutes == 45
    assert session.scheduled_at == datetime(2026, 9, 10, 9, 0)
    assert session.ends_at == datetime(2026, 9, 10, 9, 45)
    assert "Engineering" in session.search_document
