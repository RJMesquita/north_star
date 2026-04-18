"""Shared backend test fixtures."""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from sklearn.feature_extraction.text import TfidfVectorizer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models import SessionRecord
from app.services import RecommendationService


@pytest.fixture
def sample_sessions() -> list[SessionRecord]:
    """Return normalized sessions for recommendation and API tests."""

    first_start = datetime(2026, 9, 10, 9, 0)
    second_start = datetime(2026, 9, 10, 9, 30)
    third_start = datetime(2026, 9, 10, 14, 0)

    return [
        SessionRecord(
            session_id="S1",
            title="Production RAG Pipelines",
            description="Build reliable retrieval augmented generation systems.",
            speakers="Jane Doe",
            track="Engineering",
            talk_type="Technical",
            level="Intermediate",
            keywords="rag, retrieval, llm",
            scheduled_at=first_start,
            ends_at=first_start + timedelta(minutes=45),
            duration_minutes=45,
            search_document=(
                "Production RAG Pipelines Build reliable retrieval augmented "
                "generation systems. Engineering Technical Intermediate "
                "rag retrieval llm"
            ),
        ),
        SessionRecord(
            session_id="S2",
            title="Responsible AI Program Design",
            description="Frameworks for practical AI governance.",
            speakers="Alex Roe and Sam Lee",
            track="Responsible AI",
            talk_type="Applications",
            level="Beginner",
            keywords="governance, policy, ethics",
            scheduled_at=second_start,
            ends_at=second_start + timedelta(minutes=45),
            duration_minutes=45,
            search_document=(
                "Responsible AI Program Design Frameworks for practical AI "
                "governance. Responsible AI Applications Beginner "
                "governance policy ethics"
            ),
        ),
        SessionRecord(
            session_id="S3",
            title="Advanced Observability for LLM Apps",
            description="Tracing and evaluation techniques for AI systems.",
            speakers="Taylor Poe",
            track="Engineering",
            talk_type="Technical",
            level="Advanced",
            keywords="observability, eval, tracing",
            scheduled_at=third_start,
            ends_at=third_start + timedelta(minutes=60),
            duration_minutes=60,
            search_document=(
                "Advanced Observability for LLM Apps Tracing and evaluation "
                "techniques for AI systems. Engineering Technical Advanced "
                "observability eval tracing"
            ),
        ),
    ]


@pytest.fixture
def recommendation_service(
    sample_sessions: list[SessionRecord],
) -> RecommendationService:
    """Return a recommendation service using fixture session data."""

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(
        [session.search_document for session in sample_sessions]
    )
    return RecommendationService(
        sessions=sample_sessions,
        vectorizer=vectorizer,
        tfidf_matrix=tfidf_matrix,
        anonymize_speakers=False,
    )
