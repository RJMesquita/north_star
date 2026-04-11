"""Tests for recommendation and conflict services."""

from __future__ import annotations

from app.models import RecommendationRequest


def test_get_filter_options_returns_service_metadata(recommendation_service) -> None:
    """The service should expose distinct metadata for the UI."""

    filters = recommendation_service.get_filter_options()
    assert filters.tracks == ["Engineering", "Responsible AI"]
    assert filters.talk_types == ["Applications", "Technical"]
    assert filters.levels == ["Advanced", "Beginner", "Intermediate"]
    assert "rag retrieval llm" not in filters.keywords
    assert "governance policy ethics" not in filters.keywords
    assert "Jane Doe" in filters.speakers
    assert "Sam Lee" in filters.speakers


def test_list_sessions_can_filter_by_ids(recommendation_service) -> None:
    """Session listing should return only the requested identifiers."""

    sessions = recommendation_service.list_sessions(["S2"])
    assert [session.session_id for session in sessions] == ["S2"]


def test_recommendation_respects_filters_and_limit(recommendation_service) -> None:
    """Recommendations should honor selected filters and requested limits."""

    results = recommendation_service.recommend(
        RecommendationRequest(
            tracks=["Engineering"],
            talk_types=["Technical"],
            keywords=["rag"],
            limit=1,
        )
    )

    assert len(results) == 1
    assert results[0].session_id == "S1"


def test_recommendation_applies_speaker_boost(recommendation_service) -> None:
    """Preferred speakers should increase the score of matching sessions."""

    without_boost = recommendation_service.recommend(
        RecommendationRequest(
            keywords=["rag"],
            limit=1,
        )
    )
    with_boost = recommendation_service.recommend(
        RecommendationRequest(
            keywords=["rag"],
            preferred_speakers=["Jane Doe"],
            limit=1,
        )
    )

    assert without_boost[0].session_id == "S1"
    assert with_boost[0].session_id == "S1"
    assert with_boost[0].score > without_boost[0].score


def test_recommendation_applies_time_and_duration_constraints(
    recommendation_service,
) -> None:
    """Optional schedule constraints should narrow results."""

    results = recommendation_service.recommend(
        RecommendationRequest(
            tracks=["Engineering"],
            time_preference="afternoon",
            max_duration_minutes=60,
            limit=5,
        )
    )

    assert [result.session_id for result in results] == ["S3"]


def test_check_conflicts_returns_overlapping_sessions(
    recommendation_service,
) -> None:
    """Overlap detection should flag agenda sessions in the same time block."""

    result = recommendation_service.check_conflicts("S1", ["S2", "S3"])

    assert result.has_conflict is True
    assert [session.session_id for session in result.conflicting_sessions] == ["S2"]


def test_check_conflicts_returns_empty_for_unknown_candidate(
    recommendation_service,
) -> None:
    """Unknown candidate ids should not raise or report conflicts."""

    result = recommendation_service.check_conflicts("missing", ["S1"])
    assert result.has_conflict is False
    assert result.conflicting_sessions == []
