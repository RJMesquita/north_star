# Schedulize

Schedulize is a Web MVP for the **Data Makers Fest 2026** schedule recommender
described in [docs/prd.md](docs/prd.md). It helps attendees turn a short
interest profile into ranked session recommendations and a conflict-aware
personal agenda.

This implementation intentionally targets the first meaningful web milestone
from the PRD:
- Profile capture
- Recommendation ranking
- Agenda save/remove
- Conflict warnings

The following PRD items are still deferred:
- Notes
- Summaries and action items
- Export
- Authentication
- Server-side user persistence

## Architecture

The repo is now split into two app layers:

- `backend/`: FastAPI service that loads the workbook, normalizes session data,
  computes TF-IDF recommendations, and checks agenda conflicts
- `frontend/`: React + TypeScript SPA that captures user preferences, renders
  ranked results, and persists the agenda in browser storage

That split was chosen for two reasons:
- The recommendation engine and schedule logic belong on the backend because
  they operate on conference data and should expose stable contracts.
- The MVP does not need accounts yet, so agenda/profile persistence stays in
  the browser to keep scope aligned with the PRD.

## API Surface

The backend exposes four main endpoints:

- `GET /health`
  - Simple status endpoint for local troubleshooting.
- `GET /sessions/filters`
  - Returns distinct tracks, talk types, and levels for the profile form.
  - `GET` is used because this is stable server-owned reference data.
- `GET /sessions?ids=...`
  - Returns normalized session records.
  - The frontend uses this to hydrate agenda cards from saved session ids.
- `POST /recommendations`
  - Accepts a structured profile payload and returns ranked sessions.
  - `POST` is used because this is a computation request with arrays, free
    text, and optional constraints rather than a simple resource fetch.
- `POST /agenda/check-conflicts`
  - Accepts a candidate session plus current agenda ids and returns overlap
    warnings.
  - `POST` is used because the frontend sends transient user state for the
    backend to evaluate.

## Data Source

The app reads the conference workbook from:

```text
data/data-makers-fest-2026.xlsx
```

The current backend expects the `Accepted sessions` worksheet with at least
these columns:

- `Session Id`
- `Title`
- `Description`
- `Speakers`
- `Track`
- `Type of Talk`
- `Level of talk`
- `Keywords`
- `Scheduled At`
- `Scheduled Duration`

## Local Development

### Make Targets

From the repo root:

```bash
make install
make run
make test
```

Use `make help` to list all available targets.

### Backend

From the repo root:

```bash
cd backend
uv run uvicorn main:app --reload
```

The API runs on `http://127.0.0.1:8000`.

### Frontend

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

The SPA runs on `http://127.0.0.1:5173`.

## Tests

### Backend

```bash
make test-backend
```

### Frontend

```bash
make test-frontend
```

## User Flow

The Web MVP follows this call sequence:

1. The frontend loads and requests `GET /sessions/filters`.
2. The user selects tracks, talk types, levels, keywords, speakers, and optional
   schedule constraints.
3. The frontend submits `POST /recommendations`.
4. The user adds a session to their agenda.
5. Before saving, the frontend calls `POST /agenda/check-conflicts`.
6. The frontend stores accepted session ids in browser local storage.
7. On reload, the frontend calls `GET /sessions?ids=...` to hydrate the saved
   agenda.

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── dataset.py
│   │   ├── models.py
│   │   └── services.py
│   ├── main.py
│   └── pyproject.toml
├── data/
│   └── data-makers-fest-2026.xlsx
├── docs/
│   └── prd.md
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── lib/
    │   └── styles/
    ├── package.json
    └── vite.config.ts
```

## Verification

What has been verified in this repo:

- Python syntax compilation for the new backend modules
- Backend import smoke test via `uv run python`, confirming the FastAPI app
  boots and registers routes
- Backend automated tests: `25 passed`
- Frontend automated tests: `4 passed`

What is not yet verified here:

- Frontend production build, because `npm install` may depend on local registry
  access in your environment

## Next Likely Steps

- Add backend tests for recommendation filters and schedule overlap logic
- Add frontend tests for local storage and agenda flows
- Add session detail views and recommendation rationale
- Implement notes and export once the agenda UX is stable
