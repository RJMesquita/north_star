# Profile-Based Schedule Recommender

A CLI tool that helps attendees of **Makers Fest 2026** discover the sessions they should not miss, by building a personalised profile and ranking all sessions using TF-IDF similarity.

---

## How it works

1. Reads session and speaker data from `data/data-makers-fest-2026.xlsx`.
2. Asks a short series of targeted questions about your interests:
   - Preferred **tracks**
   - Preferred **talk types**
   - Preferred **experience levels**
   - Free-text **keywords / topics**
   - **Favourite speakers**
3. Combines your answers into a single query vector and compares it against every session using a **TF-IDF vectorizer** and **cosine similarity**.
4. Displays the top-ranked sessions in a formatted table.

---

## Requirements

- Python ≥ 3.13
- [uv](https://github.com/astral-sh/uv) (recommended) **or** pip

Dependencies (declared in `pyproject.toml`):

| Package | Purpose |
|---|---|
| `pandas` | Read and process the Excel data file |
| `openpyxl` | Excel engine for pandas |
| `scikit-learn` | TF-IDF vectorizer and cosine similarity |
| `rich` | Formatted terminal output and interactive prompts |

---

## Setup

### With uv (recommended)

```bash
uv sync
uv run main.py
```

### With pip

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
python main.py
```

---

## Data file

Place the conference spreadsheet at:

```
data/data-makers-fest-2026.xlsx
```

The file must contain two sheets:

| Sheet | Required columns |
|---|---|
| `Accepted sessions` | `Session Id`, `Title`, `Description`, `Speakers`, `Track`, `Type of Talk`, `Level of talk`, `Keywords`, `Scheduled At`, `Scheduled Duration` |
| `Accepted speakers` | `Speaker Id`, `FirstName`, `LastName`, `TagLine`, `Bio` |

---

## Usage

```bash
uv run main.py
```

The tool will prompt you interactively and then print a ranked recommendation table:

```
Please answer a few questions to help us recommend sessions for you.

Available tracks:
  1. AI & Machine Learning
  2. DevOps & Platform Engineering
  ...

Enter the numbers of your preferred tracks (comma separated, or leave blank for all): 1,3
...

┌──────────────────────────────── Recommended sessions ────────────────────────────────┐
│ Rank │ ID  │ Title             │ Track │ Type  │ Level │ Scheduled At │ Score │ ...  │
│ 1    │ ... │ ...               │ ...   │ ...   │ ...   │ ...          │ 0.87  │ ...  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Project structure

```
.
├── main.py                        # Entry point and all application logic
├── pyproject.toml                 # Project metadata and dependencies
├── data/
│   └── data-makers-fest-2026.xlsx # Conference data (not tracked in git)
└── README.md
```

---

## Docker

```bash
# Build
docker build -t schedule-recommender .

# Run (mount the data directory)
docker run -it --rm -v "$(pwd)/data:/app/data" schedule-recommender
```