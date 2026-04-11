"""Recommendation and schedule-conflict services."""

from __future__ import annotations

from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.dataset import build_filter_options, load_sessions
from app.models import (
    ConflictCheckResult,
    FilterOptions,
    RecommendationRequest,
    RecommendationResult,
    SessionRecord,
    SessionResponse,
)


SPEAKER_BONUS = 0.1


def _to_session_response(session: SessionRecord) -> SessionResponse:
    """Convert a session record into an API response payload."""

    return SessionResponse(
        session_id=session.session_id,
        title=session.title,
        description=session.description,
        speakers=session.speakers,
        track=session.track,
        talk_type=session.talk_type,
        level=session.level,
        keywords=session.keywords,
        scheduled_at=session.scheduled_at,
        ends_at=session.ends_at,
        duration_minutes=session.duration_minutes,
    )


@dataclass(slots=True)
class RecommendationService:
    """Service responsible for session retrieval and recommendation ranking."""

    sessions: list[SessionRecord]
    vectorizer: TfidfVectorizer
    tfidf_matrix: object

    @classmethod
    def create(cls) -> "RecommendationService":
        """Build the recommendation service from workbook data.

        Returns:
            A ready-to-use recommendation service instance.
        """

        sessions = load_sessions()
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(
            [session.search_document for session in sessions]
        )
        return cls(
            sessions=sessions,
            vectorizer=vectorizer,
            tfidf_matrix=tfidf_matrix,
        )

    def get_filter_options(self) -> FilterOptions:
        """Return distinct filter options for the UI."""

        return build_filter_options(self.sessions)

    def list_sessions(
        self,
        session_ids: list[str] | None = None,
    ) -> list[SessionResponse]:
        """Return sessions, optionally filtered by id.

        Args:
            session_ids: Optional list of session ids to include.

        Returns:
            Normalized sessions for API responses.
        """

        if session_ids:
            session_id_set = set(session_ids)
            selected_sessions = [
                session
                for session in self.sessions
                if session.session_id in session_id_set
            ]
        else:
            selected_sessions = self.sessions
        return [_to_session_response(session) for session in selected_sessions]

    def recommend(self, request: RecommendationRequest) -> list[RecommendationResult]:
        """Compute recommendations for a user profile.

        Args:
            request: Recommendation inputs supplied by the frontend.

        Returns:
            Ranked recommendation results.
        """

        query_terms = [
            *request.tracks,
            *request.talk_types,
            *request.levels,
            *request.keywords,
        ]
        query = " ".join(term for term in query_terms if term).strip() or "data science"
        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        preferred_speakers = [speaker.lower() for speaker in request.preferred_speakers]
        ranked_sessions: list[RecommendationResult] = []
        for index, session in enumerate(self.sessions):
            if request.tracks and session.track not in request.tracks:
                continue
            if request.talk_types and session.talk_type not in request.talk_types:
                continue
            if request.levels and session.level not in request.levels:
                continue
            if (
                request.max_duration_minutes is not None
                and session.duration_minutes is not None
                and session.duration_minutes > request.max_duration_minutes
            ):
                continue
            if request.time_preference and not _matches_time_preference(
                session=session,
                time_preference=request.time_preference,
            ):
                continue

            score = float(scores[index])
            session_speakers = session.speakers.lower()
            if preferred_speakers and any(
                speaker in session_speakers for speaker in preferred_speakers
            ):
                score += SPEAKER_BONUS
            if score <= 0:
                continue

            ranked_sessions.append(
                RecommendationResult(
                    **_to_session_response(session).model_dump(),
                    score=round(score, 4),
                )
            )

        ranked_sessions.sort(key=lambda session: session.score, reverse=True)
        return ranked_sessions[: request.limit]

    def check_conflicts(
        self,
        candidate_session_id: str,
        agenda_session_ids: list[str],
    ) -> ConflictCheckResult:
        """Return any agenda conflicts for the candidate session.

        Args:
            candidate_session_id: Session the user wants to add.
            agenda_session_ids: Existing agenda session ids.

        Returns:
            A conflict-check result payload.
        """

        session_map = {session.session_id: session for session in self.sessions}
        candidate = session_map.get(candidate_session_id)
        if candidate is None:
            return ConflictCheckResult(
                candidate_session_id=candidate_session_id,
                has_conflict=False,
                conflicting_sessions=[],
            )

        conflicting_sessions: list[SessionResponse] = []
        for agenda_session_id in agenda_session_ids:
            existing_session = session_map.get(agenda_session_id)
            if existing_session is None:
                continue
            if _sessions_overlap(candidate, existing_session):
                conflicting_sessions.append(_to_session_response(existing_session))

        return ConflictCheckResult(
            candidate_session_id=candidate_session_id,
            has_conflict=bool(conflicting_sessions),
            conflicting_sessions=conflicting_sessions,
        )


def _matches_time_preference(session: SessionRecord, time_preference: str) -> bool:
    """Return whether a session matches the requested part of day."""

    if session.scheduled_at is None:
        return False

    hour = session.scheduled_at.hour
    normalized_preference = time_preference.strip().lower()
    if normalized_preference == "morning":
        return hour < 12
    if normalized_preference == "afternoon":
        return 12 <= hour < 17
    if normalized_preference == "evening":
        return hour >= 17
    return True


def _sessions_overlap(first: SessionRecord, second: SessionRecord) -> bool:
    """Return whether two scheduled sessions overlap in time."""

    if (
        first.scheduled_at is None
        or first.ends_at is None
        or second.scheduled_at is None
        or second.ends_at is None
    ):
        return False

    latest_start = max(first.scheduled_at, second.scheduled_at)
    earliest_end = min(first.ends_at, second.ends_at)
    return latest_start < earliest_end
