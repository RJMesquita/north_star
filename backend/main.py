from __future__ import annotations

import os
import re
import sys
from dataclasses import dataclass, field
from typing import List, Dict, Optional

import pandas as pd
from rich import print
from rich.prompt import Prompt, Confirm
from rich.table import Table
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class Session:
    session_id: str
    title: str
    description: str
    speakers: str
    track: str
    talk_type: str
    level: str
    keywords: str
    scheduled_at: str
    duration: str

    def as_query(self) -> str:
        """
        Compose a combined string of all descriptive fields for TF‑IDF.

        Values may be ``NaN`` (which become floats when read from pandas);
        converting everything to strings avoids type errors when joining.
        Empty or null values are skipped.
        """
        parts = [
            self.title,
            self.description,
            self.track,
            self.talk_type,
            self.level,
            self.keywords,
        ]
        tokens: List[str] = []
        for p in parts:
            if p is None:
                continue
            if isinstance(p, float):
                # Skip NaN values
                continue
            s = str(p).strip()
            if s:
                tokens.append(s)
        return " ".join(tokens)


class ProfileRecommender:
    def __init__(self, excel_path: str) -> None:
        self.sessions: List[Session] = []
        self.speakers: Dict[str, Dict[str, str]] = {}
        self._load_data(excel_path)
        self.vectorizer: TfidfVectorizer
        self.tfidf_matrix = None
        self._build_vectorizer()

    def _load_data(self, excel_path: str) -> None:
        if not os.path.exists(excel_path):
            print(f"[red]Data file not found: {excel_path}[/red]")
            sys.exit(1)
        xl = pd.ExcelFile(excel_path)
        sessions_df = pd.read_excel(xl, sheet_name="Accepted sessions")
        speakers_df = pd.read_excel(xl, sheet_name="Accepted speakers")
        # Load sessions
        for _, row in sessions_df.iterrows():
            session = Session(
                session_id=str(row["Session Id"]),
                title=row.get("Title", ""),
                description=row.get("Description", ""),
                speakers=row.get("Speakers", ""),
                track=row.get("Track", ""),
                talk_type=row.get("Type of Talk", ""),
                level=row.get("Level of talk", ""),
                keywords=row.get("Keywords", ""),
                scheduled_at=str(row.get("Scheduled At", "")),
                duration=str(row.get("Scheduled Duration", "")),
            )
            self.sessions.append(session)
        # Load speaker info
        for _, row in speakers_df.iterrows():
            sid = row.get("Speaker Id")
            self.speakers[sid] = {
                "name": f"{row.get('FirstName', '')} {row.get('LastName', '')}",
                "tagline": row.get("TagLine", ""),
                "bio": row.get("Bio", ""),
            }

    def _build_vectorizer(self) -> None:
        docs = [s.as_query() for s in self.sessions]
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.tfidf_matrix = self.vectorizer.fit_transform(docs)

    def ask_questions(self) -> Dict[str, List[str]]:
        """Interactively ask the user key questions to build a profile."""
        # Extract unique options
        tracks = sorted({s.track for s in self.sessions if pd.notna(s.track) and s.track})
        talk_types = sorted({s.talk_type for s in self.sessions if pd.notna(s.talk_type) and s.talk_type})
        levels = sorted({s.level for s in self.sessions if pd.notna(s.level) and s.level})

        print("[bold cyan]\nPlease answer a few questions to help us recommend sessions for you.[/bold cyan]")
        # Preferred tracks
        print("\nAvailable tracks:")
        for i, trk in enumerate(tracks, 1):
            print(f"  {i}. {trk}")
        track_input = Prompt.ask(
            "Enter the numbers of your preferred tracks (comma separated, or leave blank for all)",
            default="",
        )
        preferred_tracks: List[str] = []
        if track_input.strip():
            indices = [i.strip() for i in track_input.split(",") if i.strip().isdigit()]
            for idx in indices:
                i = int(idx) - 1
                if 0 <= i < len(tracks):
                    preferred_tracks.append(tracks[i])

        # Preferred talk types
        print("\nAvailable talk types:")
        for i, ttype in enumerate(talk_types, 1):
            print(f"  {i}. {ttype}")
        type_input = Prompt.ask(
            "Enter the numbers of your preferred talk types (comma separated, or leave blank for all)",
            default="",
        )
        preferred_types: List[str] = []
        if type_input.strip():
            indices = [i.strip() for i in type_input.split(",") if i.strip().isdigit()]
            for idx in indices:
                i = int(idx) - 1
                if 0 <= i < len(talk_types):
                    preferred_types.append(talk_types[i])

        # Preferred levels
        print("\nAvailable talk levels:")
        for i, lvl in enumerate(levels, 1):
            print(f"  {i}. {lvl}")
        level_input = Prompt.ask(
            "Enter the numbers of your preferred talk levels (comma separated, or leave blank for all)",
            default="",
        )
        preferred_levels: List[str] = []
        if level_input.strip():
            indices = [i.strip() for i in level_input.split(",") if i.strip().isdigit()]
            for idx in indices:
                i = int(idx) - 1
                if 0 <= i < len(levels):
                    preferred_levels.append(levels[i])

        # Interest keywords
        keywords_input = Prompt.ask(
            "Enter up to three keywords or topics you're most interested in (comma separated)",
            default="",
        )
        preferred_keywords = [k.strip() for k in keywords_input.split(",") if k.strip()]

        # Favourite speakers
        speaker_input = Prompt.ask(
            "List any speaker names you want to follow (comma separated), or leave blank",
            default="",
        )
        preferred_speakers = [s.strip().lower() for s in speaker_input.split(",") if s.strip()]

        return {
            "tracks": preferred_tracks,
            "types": preferred_types,
            "levels": preferred_levels,
            "keywords": preferred_keywords,
            "speakers": preferred_speakers,
        }

    def build_query(self, profile: Dict[str, List[str]]) -> str:
        """Combine user preferences into a single query string for TF‑IDF."""
        parts: List[str] = []
        for cat in ["tracks", "types", "levels"]:
            parts.extend(profile.get(cat, []))
        parts.extend(profile.get("keywords", []))
        return " ".join(parts)

    def recommend(self, profile: Dict[str, List[str]], top_n: int = 5) -> List[Dict[str, str]]:
        query = self.build_query(profile)
        if not query:
            # If the user provided no preferences, simply recommend based on popular keywords
            query = "data science"
        query_vec = self.vectorizer.transform([query])
        cosine_sim = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        # Add a small bonus for speaker matches
        bonus = 0.1
        for i, session in enumerate(self.sessions):
            if profile.get("speakers"):
                speaker_names = session.speakers.lower() if session.speakers else ""
                for fav in profile["speakers"]:
                    if fav in speaker_names:
                        cosine_sim[i] += bonus

        # Pair sessions with scores
        paired = [
            (i, score) for i, score in enumerate(cosine_sim)
        ]
        # Sort by score descending
        ranked = sorted(paired, key=lambda x: x[1], reverse=True)
        recommendations: List[Dict[str, str]] = []
        count = 0
        for idx, score in ranked:
            if score <= 0:
                continue
            session = self.sessions[idx]
            # Filter by user preferences: track, type, level if provided
            if profile["tracks"] and session.track not in profile["tracks"]:
                continue
            if profile["types"] and session.talk_type not in profile["types"]:
                continue
            if profile["levels"] and session.level not in profile["levels"]:
                continue
            recommendations.append(
                {
                    "session_id": session.session_id,
                    "title": session.title,
                    "track": session.track,
                    "type": session.talk_type,
                    "level": session.level,
                    "scheduled_at": session.scheduled_at,
                    "duration": session.duration,
                    "score": f"{score:.2f}",
                    "speakers": session.speakers,
                }
            )
            count += 1
            if count >= top_n:
                break
        return recommendations

    def display_recommendations(self, recs: List[Dict[str, str]]) -> None:
        if not recs:
            print("[yellow]No sessions matched your preferences.[/yellow]")
            return
        table = Table(title="Recommended sessions", show_lines=True)
        table.add_column("Rank", style="yellow")
        table.add_column("ID", style="cyan")
        table.add_column("Title")
        table.add_column("Track")
        table.add_column("Type")
        table.add_column("Level")
        table.add_column("Scheduled At")
        table.add_column("Duration", justify="right")
        table.add_column("Score", justify="right")
        table.add_column("Speakers")
        for i, rec in enumerate(recs, 1):
            table.add_row(
                str(i),
                rec["session_id"],
                rec["title"],
                rec["track"],
                rec["type"],
                rec["level"],
                rec["scheduled_at"],
                rec["duration"],
                rec["score"],
                rec["speakers"],
            )
        print()
        print(table)

    def run(self) -> None:
        profile = self.ask_questions()
        recs = self.recommend(profile)
        self.display_recommendations(recs)


def main():
    excel_path = os.path.join(os.path.dirname(__file__), "data", "data-makers-fest-2026.xlsx")
    recommender = ProfileRecommender(excel_path)
    recommender.run()


if __name__ == "__main__":
    main()