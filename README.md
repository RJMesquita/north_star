<p align="center">
  <img src="frontend/public/logo-mark.png" alt="North Star logo" width="112" />
</p>

<h1 align="center">North Star</h1>

<p align="center">
  <a href="https://github.com/RJMesquita/north_star/releases">
    <img src="https://img.shields.io/badge/version-0.1.1-blue" alt="Version badge" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License badge" />
  </a>
  <img src="https://img.shields.io/badge/visibility-private-lightgrey" alt="Visibility badge" />
  <a href="https://github.com/RJMesquita/north_star/actions/workflows/ci-cd.yml">
    <img src="https://github.com/RJMesquita/north_star/actions/workflows/ci-cd.yml/badge.svg?branch=main" alt="CI/CD status badge" />
  </a>
</p>

North Star is a conference schedule planning app for **Data Makers Fest 2026**.
It helps attendees turn broad interests into a workable event agenda by combining
session metadata, recommendation scoring, conflict checks, and calendar export.

Built during the **DSPT Vibe Coding Hackathon** dedicated to Data Makers Fest,
this is an independent project by the repository authors. It is not an official
Data Makers Fest application and is not maintained, sponsored, endorsed, or
operated by the event organization.

Data Makers Fest 2026: **May 4 to May 6, 2026** in **Alfandega do Porto,
Portugal**. Official links: [site](https://www.datamakersfest.com/),
[agenda](https://www.datamakersfest.com/agenda),
[tickets](https://www.datamakersfest.com/tickets).

## What It Does

- Loads conference sessions from the event workbook
- Lets attendees filter by track, talk type, level, topic, and speaker
- Ranks sessions with a TF-IDF recommendation model
- Detects schedule conflicts before agenda changes are saved
- Stores the attendee profile and agenda locally in the browser
- Exports the saved agenda as Markdown or `.ics`

## Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- Vitest + Testing Library

### Backend

- FastAPI
- Python 3.13
- pandas + openpyxl for workbook loading
- scikit-learn TF-IDF + cosine similarity for recommendation scoring
- pytest + httpx for API and service tests

### Tooling

- `uv` for Python dependency management
- `npm` for frontend dependency management
- `make` for common local development commands
- GitHub Actions for CI/CD validation

## Architecture

The repo is split into two application layers and one data source:

- `frontend/`: Single-page React client for profile capture, recommendations,
  agenda review, local persistence, and export
- `backend/`: FastAPI API for workbook normalization, recommendation scoring,
  session lookup, and agenda conflict checks
- `data/`: Excel workbook used as the current source of conference truth

### Request Flow

1. The frontend calls `GET /sessions/filters` to load selectable metadata.
2. The attendee submits a profile to `POST /recommendations`.
3. The backend filters and ranks sessions from the workbook-derived dataset.
4. The frontend adds sessions to the agenda and checks overlaps through
   `POST /agenda/check-conflicts`.
5. Saved agenda ids are persisted in browser local storage.
6. On reload, the frontend calls `GET /sessions?ids=...` to rehydrate the plan.

### Backend Responsibilities

- Read and normalize the `Accepted sessions` worksheet
- Build filter option lists from normalized session metadata
- Rank sessions from structured attendee preferences
- Check overlap between candidate and existing agenda sessions
- Expose a small API surface for the SPA

### Frontend Responsibilities

- Capture attendee preferences
- Call the backend API and render ranked sessions
- Manage agenda additions, removals, and export
- Persist profile and agenda state locally
- Present the North Star branded experience

## Repository Layout

```text
.
├── backend/
│   ├── app/
│   │   ├── dataset.py
│   │   ├── models.py
│   │   └── services.py
│   ├── main.py
│   ├── pyproject.toml
│   └── tests/
├── data/
│   └── data-makers-fest-2026.xlsx
├── docs/
│   └── prd.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── test/
│   ├── package.json
│   └── package-lock.json
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── LICENSE
├── NOTICE.md
└── Makefile
```

## API Surface

Machine-readable contract: [docs/openapi.json](/home/daniel/code/dosorio79/schedulize/docs/openapi.json)

Regenerate it with:

```bash
make openapi
```

- `GET /health`
  Returns backend health status.
- `GET /sessions/filters`
  Returns distinct tracks, talk types, levels, keywords, and speakers.
- `GET /sessions?ids=...`
  Returns normalized sessions, optionally filtered by session id.
- `POST /recommendations`
  Accepts attendee preferences and returns ranked recommendations.
- `POST /agenda/check-conflicts`
  Accepts a candidate session id plus existing agenda ids and returns overlap
  warnings.

## Data Source

The backend reads the workbook at:

```text
data/data-makers-fest-2026.xlsx
```

The current implementation expects the `Accepted sessions` worksheet with at
least these columns:

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

### Prerequisites

- Python 3.13
- Node.js 22
- `uv`
- `npm`
- `make`

### Install Dependencies

From the repository root:

```bash
make install
```

### Optional Configuration

Copy `.env-example` to `.env` and set:

```bash
ANONYMIZE_SPEAKERS=true
```

When enabled, the backend replaces real speaker names with deterministic fake
names across filter options, recommendation results, saved agenda sessions, and
conflict checks.

### Run Both Apps

```bash
make run
```

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

### Run Individually

Backend:

```bash
cd backend
uv sync --group dev
uv run uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Testing

Run everything:

```bash
make test
```

Run backend only:

```bash
make test-backend
```

Run frontend only:

```bash
make test-frontend
```

Production frontend build:

```bash
cd frontend
npm run build
```

## CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yml`

It currently validates release readiness by:

- Running backend tests on Python 3.13 with `uv sync --locked`
- Running frontend tests with `npm ci`
- Building the frontend bundle after tests pass
- Triggering on pushes and pull requests to `main` and `dev`
- Triggering on version tags matching `v*`

This workflow is CI-first. It does not deploy anywhere yet because the repo
does not currently define a target hosting platform or deployment secrets.

## Product Branding

The shipped UI is branded as **North Star**.

- Repository and package names still use `schedulize`
- Frontend copy uses the subtitle `Conference Personal Schedule Optimization`
- Brand assets live in `frontend/img/` and `frontend/public/`

## Origin And Affiliation

- Built during the DSPT Vibe Coding Hackathon focused on Data Makers Fest
- Uses a hackathon-context conference workbook for prototyping
- Not an official event application
- Not part of the Data Makers Fest organization
- Not a statement of sponsorship, partnership, or endorsement

## License

The source code in this repository is licensed under the MIT License. See
`LICENSE`.

The workbook under `data/` is not covered by the MIT License unless you are the
rights holder and explicitly say otherwise. See `NOTICE.md` before making this
repository public or representing it outside the current private-release scope.

## Maintainer Notes

Release process notes live in [docs/release-checklist.md](/home/daniel/code/dosorio79/schedulize/docs/release-checklist.md).
