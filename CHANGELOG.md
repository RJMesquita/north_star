# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project uses semantic versioning.

## [Unreleased]

### Changed
- Refined the README hero and intro layout for clearer release-facing presentation.
- Linked repository badges to project resources and switched the CI badge to the live GitHub Actions workflow.
- Added Data Makers Fest 2026 reference links to the project overview.

## [0.1.1] - 2026-04-11

### Added
- Shipped the React and TypeScript web MVP for attendee profile capture, session recommendations, agenda management, and export.
- Added backend and frontend test coverage plus local developer workflows.
- Tracked the backend `uv.lock` file to make CI dependency resolution reproducible.
- Added release metadata and the machine-readable OpenAPI contract under `docs/openapi.json`.

### Changed
- Improved agenda planning and export behavior in the web application.
- Refined the layout and styling of the agenda, profile, and recommendations panels.
- Applied North Star branding updates across the UI, documentation, logos, and favicons.
- Expanded the README and local documentation to reflect the product positioning and current developer setup.

## [0.0.1] - 2026-04-11

### Added
- Introduced the FastAPI recommendation API foundation.
- Added dataset loading and normalization for the conference workbook.
- Added recommendation scoring, session models, and agenda conflict checking services.
- Exposed the initial API routes for health checks, sessions, recommendations, and conflict detection.
