# North Star

North Star is the current web application implementation for the
**Data Makers Fest 2026** schedule recommender described in
[docs/prd.md](docs/prd.md). It helps attendees move from broad
interests to a usable conference plan:

- Select tracks, talk types, levels, topics, and speakers from the actual
  dataset
- Get ranked session recommendations
- Add one session or the full recommendation set to a personal agenda
- Catch schedule conflicts before saving
- Review the saved agenda in a calendar-style day view
- Export the agenda as Markdown or `.ics`

Still deferred:
- Notes
- Summaries and action items
- Authentication
- Server-side user persistence

## Branding

The shipped UI is branded as **North Star** and includes:

- A custom logo under `frontend/img/`
- Favicon assets generated in `frontend/public/`
- A dark indigo visual theme with cyan and magenta accents derived from the
  logo

The repository name and backend package names still use `schedulize`, but the
user-facing frontend currently presents the product as North Star.

## Architecture

The repo is now split into two app layers:

- `backend/`: FastAPI service that loads the workbook, normalizes session data,
  computes TF-IDF recommendations, surfaces filter metadata, and checks agenda
  conflicts
- `frontend/`: React + TypeScript SPA styled with Tailwind CSS that captures
  user preferences, renders ranked results, persists the agenda in browser
  storage, supports export, and includes North Star branding assets

That split was chosen for two reasons:
- The recommendation engine and schedule logic belong on the backend because
  they operate on conference data and should expose stable contracts.
- The current product does not need accounts yet, so agenda/profile persistence
  stays in
  the browser to keep scope aligned with the PRD.

## API Surface

The backend exposes four main endpoints:

- `GET /health`
  - Simple status endpoint for local troubleshooting.
- `GET /sessions/filters`
  - Returns distinct tracks, talk types, levels, keywords, and speakers for the
    profile form.
  - `GET` is used because this is stable server-owned reference data.
- `GET /sessions?ids=...`
  - Returns normalized session records.
  - The frontend uses this to rebuild agenda cards from saved session ids.
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

## Product Behavior

- Topics and speakers are selected from dataset-derived lists rather than free
  text entry.
- Recommendation results can be saved one at a time or all at once.
- Agenda conflicts are checked before saving and can still be overridden by the
  user.
- The agenda is displayed as a day-grouped calendar view optimized for a
  conference schedule rather than a month grid.
- Exports are generated client-side as Markdown and `.ics`.
- Favicons and the browser title are set from the North Star branding.

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

The frontend uses Tailwind CSS through the Vite plugin, so `npm install` is
required before local UI development or builds.

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

The app follows this call sequence:

1. The frontend loads and requests `GET /sessions/filters`.
2. The user selects tracks, talk types, levels, dataset-derived topics,
   speakers, and optional schedule constraints.
3. The frontend submits `POST /recommendations`.
4. The user adds one session or all returned sessions to their agenda.
5. Before each save, the frontend calls `POST /agenda/check-conflicts`.
6. The frontend stores accepted session ids in browser local storage.
7. On reload, the frontend calls `GET /sessions?ids=...` to rebuild the saved
   agenda.
8. The agenda can be exported to Markdown or `.ics` from the UI.

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
    ├── img/
    ├── public/
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
- Backend automated tests: `27 passed`
- Frontend automated tests: `5 passed`
- Frontend production build: passed

## Next Likely Steps

- Add session detail views and recommendation rationale
- Improve the calendar layout further if a denser timetable view is needed
- Implement notes once the agenda UX is stable
