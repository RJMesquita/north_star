"""Runtime configuration for the backend."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"


def _parse_bool_env(name: str, default: bool = False) -> bool:
    """Parse a conventional boolean environment variable."""

    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _load_env_file(env_file_path: Path = ENV_FILE_PATH) -> None:
    """Load simple KEY=VALUE pairs from a local .env file if present."""

    if not env_file_path.exists():
        return

    for raw_line in env_file_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key:
            continue

        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


@dataclass(frozen=True, slots=True)
class Settings:
    """Backend runtime settings."""

    anonymize_speakers: bool = False


def load_settings() -> Settings:
    """Load backend settings from environment variables."""

    _load_env_file()
    return Settings(
        anonymize_speakers=_parse_bool_env("ANONYMIZE_SPEAKERS", default=False),
    )
