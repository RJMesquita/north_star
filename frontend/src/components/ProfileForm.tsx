import { useState } from "react";

import type { FilterOptions, TimePreference, UserProfile } from "../lib/types";

interface ProfileFormProps {
  filters: FilterOptions;
  initialProfile: UserProfile;
  isLoading: boolean;
  onSubmit: (profile: UserProfile) => void;
}

const TIME_PREFERENCES: Array<{ label: string; value: TimePreference }> = [
  { label: "Any time", value: "" },
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
];

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function splitCommaValues(rawValue: string): string[] {
  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function ProfileForm({
  filters,
  initialProfile,
  isLoading,
  onSubmit,
}: ProfileFormProps): JSX.Element {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  function updateField<K extends keyof UserProfile>(
    key: K,
    value: UserProfile[K],
  ): void {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [key]: value,
    }));
  }

  return (
    <form
      className="panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(profile);
      }}
    >
      <div className="panel-heading">
        <p className="eyebrow">Step 1</p>
        <h2>Build your conference profile</h2>
        <p>
          The PRD calls for a short, high-signal questionnaire. This version
          captures the strongest recommendation inputs without forcing account
          creation or backend persistence.
        </p>
      </div>

      <div className="form-grid">
        <FilterGroup
          title="Tracks"
          options={filters.tracks}
          selectedValues={profile.tracks}
          onToggle={(value) =>
            updateField("tracks", toggleValue(profile.tracks, value))
          }
        />
        <FilterGroup
          title="Talk types"
          options={filters.talk_types}
          selectedValues={profile.talkTypes}
          onToggle={(value) =>
            updateField("talkTypes", toggleValue(profile.talkTypes, value))
          }
        />
        <FilterGroup
          title="Levels"
          options={filters.levels}
          selectedValues={profile.levels}
          onToggle={(value) =>
            updateField("levels", toggleValue(profile.levels, value))
          }
        />

        <label className="field">
          <span>Keywords</span>
          <textarea
            value={profile.keywords.join(", ")}
            onChange={(event) =>
              updateField("keywords", splitCommaValues(event.target.value))
            }
            placeholder="rag, data engineering, observability"
            rows={3}
          />
        </label>

        <label className="field">
          <span>Preferred speakers</span>
          <textarea
            value={profile.preferredSpeakers.join(", ")}
            onChange={(event) =>
              updateField(
                "preferredSpeakers",
                splitCommaValues(event.target.value),
              )
            }
            placeholder="Jane Doe, Alex Smith"
            rows={3}
          />
        </label>

        <label className="field">
          <span>Maximum duration (minutes)</span>
          <input
            type="number"
            min="1"
            value={profile.maxDurationMinutes}
            onChange={(event) =>
              updateField("maxDurationMinutes", event.target.value)
            }
            placeholder="45"
          />
        </label>

        <fieldset className="field">
          <span>Preferred time of day</span>
          <div className="pill-row">
            {TIME_PREFERENCES.map((option) => (
              <button
                key={option.value || "any"}
                type="button"
                className={
                  profile.timePreference === option.value
                    ? "pill active"
                    : "pill"
                }
                onClick={() => updateField("timePreference", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <button className="primary-button" type="submit" disabled={isLoading}>
        {isLoading ? "Finding sessions..." : "Get recommendations"}
      </button>
    </form>
  );
}

interface FilterGroupProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({
  title,
  options,
  selectedValues,
  onToggle,
}: FilterGroupProps): JSX.Element {
  return (
    <fieldset className="field">
      <span>{title}</span>
      <div className="pill-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={
              selectedValues.includes(option) ? "pill active" : "pill"
            }
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
