"""Tests for the FastAPI surface."""

from __future__ import annotations

from fastapi.testclient import TestClient

import main


def test_healthcheck_returns_ok() -> None:
    """The healthcheck endpoint should report a healthy startup."""

    client = TestClient(main.app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] in {"ok", "error"}


def test_filters_endpoint_returns_distinct_metadata(
    recommendation_service,
    monkeypatch,
) -> None:
    """The filters endpoint should expose track, type, and level options."""

    monkeypatch.setattr(
        "main.RecommendationService.create",
        lambda: recommendation_service,
    )
    client = TestClient(main.create_app())

    response = client.get("/sessions/filters")

    assert response.status_code == 200
    assert response.json() == {
        "tracks": ["Engineering", "Responsible AI"],
        "talk_types": ["Applications", "Technical"],
        "levels": ["Advanced", "Beginner", "Intermediate"],
    }


def test_sessions_endpoint_filters_by_id(
    recommendation_service,
    monkeypatch,
) -> None:
    """The sessions endpoint should support multi-id filtering."""

    monkeypatch.setattr(
        "main.RecommendationService.create",
        lambda: recommendation_service,
    )
    client = TestClient(main.create_app())

    response = client.get("/sessions", params=[("ids", "S1"), ("ids", "S3")])

    assert response.status_code == 200
    assert [session["session_id"] for session in response.json()] == ["S1", "S3"]


def test_recommendations_endpoint_returns_ranked_results(
    recommendation_service,
    monkeypatch,
) -> None:
    """The recommendations endpoint should return computed sessions."""

    monkeypatch.setattr(
        "main.RecommendationService.create",
        lambda: recommendation_service,
    )
    client = TestClient(main.create_app())

    response = client.post(
        "/recommendations",
        json={
            "tracks": ["Engineering"],
            "talk_types": ["Technical"],
            "levels": [],
            "keywords": ["rag"],
            "preferred_speakers": [],
            "time_preference": None,
            "max_duration_minutes": None,
            "limit": 2,
        },
    )

    assert response.status_code == 200
    assert response.json()[0]["session_id"] == "S1"


def test_conflict_endpoint_returns_conflicting_sessions(
    recommendation_service,
    monkeypatch,
) -> None:
    """The conflict endpoint should surface overlapping agenda sessions."""

    monkeypatch.setattr(
        "main.RecommendationService.create",
        lambda: recommendation_service,
    )
    client = TestClient(main.create_app())

    response = client.post(
        "/agenda/check-conflicts",
        json={
            "candidate_session_id": "S1",
            "agenda_session_ids": ["S2", "S3"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["has_conflict"] is True
    assert [session["session_id"] for session in payload["conflicting_sessions"]] == [
        "S2"
    ]
