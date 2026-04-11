"""Typed domain and API models for the Schedulize backend."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SessionRecord(BaseModel):
    """Normalized session data loaded from the conference workbook.

    Attributes:
        session_id: Stable session identifier from the dataset.
        title: Session title.
        description: Long-form session description.
        speakers: Speaker names as displayed in the schedule.
        track: Session track/category.
        talk_type: Session presentation type.
        level: Intended audience level.
        keywords: Session keywords from the dataset.
        scheduled_at: Session start time, if present.
        ends_at: Derived session end time, if present.
        duration_minutes: Session duration in minutes, if present.
        search_document: Combined text used for TF-IDF vectorization.
    """

    session_id: str
    title: str
    description: str
    speakers: str
    track: str
    talk_type: str
    level: str
    keywords: str
    scheduled_at: datetime | None
    ends_at: datetime | None
    duration_minutes: int | None
    search_document: str


class FilterOptions(BaseModel):
    """Reference data used to render profile filters in the UI.

    Attributes:
        tracks: Distinct tracks in the dataset.
        talk_types: Distinct talk types in the dataset.
        levels: Distinct audience levels in the dataset.
        keywords: Distinct keywords available in the dataset.
        speakers: Distinct speaker names available in the dataset.
    """

    tracks: list[str]
    talk_types: list[str]
    levels: list[str]
    keywords: list[str]
    speakers: list[str]


class RecommendationRequest(BaseModel):
    """Input used to compute personalized recommendations.

    Attributes:
        tracks: Preferred tracks.
        talk_types: Preferred talk types.
        levels: Preferred levels.
        keywords: Free-text topics of interest.
        preferred_speakers: Speaker names to boost.
        time_preference: Optional part-of-day preference.
        max_duration_minutes: Optional maximum session duration.
        limit: Maximum number of recommendations to return.
    """

    tracks: list[str] = Field(default_factory=list)
    talk_types: list[str] = Field(default_factory=list)
    levels: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    preferred_speakers: list[str] = Field(default_factory=list)
    time_preference: str | None = None
    max_duration_minutes: int | None = Field(default=None, ge=1)
    limit: int = Field(default=10, ge=1, le=25)


class SessionResponse(BaseModel):
    """Session payload returned to the frontend."""

    session_id: str
    title: str
    description: str
    speakers: str
    track: str
    talk_type: str
    level: str
    keywords: str
    scheduled_at: datetime | None
    ends_at: datetime | None
    duration_minutes: int | None


class RecommendationResult(SessionResponse):
    """Ranked recommendation payload returned by the API."""

    score: float


class ConflictCheckRequest(BaseModel):
    """Input used to evaluate agenda conflicts.

    Attributes:
        candidate_session_id: Session the user wants to add.
        agenda_session_ids: Already-saved agenda session identifiers.
    """

    candidate_session_id: str
    agenda_session_ids: list[str] = Field(default_factory=list)


class ConflictCheckResult(BaseModel):
    """Conflict evaluation result for an agenda candidate."""

    candidate_session_id: str
    has_conflict: bool
    conflicting_sessions: list[SessionResponse]
