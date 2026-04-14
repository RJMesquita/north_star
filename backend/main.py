"""FastAPI entrypoint for the Schedulize backend."""

from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_settings
from app.dataset import DatasetLoadError
from app.models import (
    ConflictCheckRequest,
    ConflictCheckResult,
    FilterOptions,
    RecommendationRequest,
    RecommendationResult,
    SessionResponse,
)
from app.services import RecommendationService


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance.

    Raises:
        DatasetLoadError: If the workbook cannot be loaded during startup.
    """

    settings = load_settings()
    service = RecommendationService.create(
        anonymize_speakers=settings.anonymize_speakers,
    )
    app = FastAPI(
        title="Schedulize API",
        version="0.1.1",
        description="Conference schedule recommendation API for the Web MVP.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        """Return a simple health status."""

        return {"status": "ok"}

    @app.get("/sessions/filters", response_model=FilterOptions)
    def get_filter_options() -> dict[str, list[str]]:
        """Return distinct filter options for the profile form."""

        filters = service.get_filter_options()
        return filters.model_dump(by_alias=True)

    @app.get("/sessions", response_model=list[SessionResponse])
    def list_sessions(
        ids: list[str] | None = Query(default=None),
    ) -> list[dict]:
        """Return normalized sessions, optionally filtered by session id."""

        return [
            session.model_dump()
            for session in service.list_sessions(ids)
        ]

    @app.post("/recommendations", response_model=list[RecommendationResult])
    def get_recommendations(
        request: RecommendationRequest,
    ) -> list[dict]:
        """Return ranked recommendations for a profile request."""

        return [
            recommendation.model_dump()
            for recommendation in service.recommend(request)
        ]

    @app.post("/agenda/check-conflicts", response_model=ConflictCheckResult)
    def check_conflicts(request: ConflictCheckRequest) -> dict:
        """Return conflict information for an agenda candidate."""

        return service.check_conflicts(
            candidate_session_id=request.candidate_session_id,
            agenda_session_ids=request.agenda_session_ids,
        ).model_dump()

    return app


try:
    app = create_app()
except DatasetLoadError as exc:
    startup_error = str(exc)
    app = FastAPI(
        title="Schedulize API",
        version="0.1.1",
        description="Conference schedule recommendation API for the Web MVP.",
    )

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        """Return startup failure details for local troubleshooting."""

        return {
            "status": "error",
            "detail": startup_error,
        }
