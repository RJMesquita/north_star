import { useState } from "react";
import type { ChangeEvent } from "react";

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

function getSelectedOptions(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions, (option) => option.value);
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
      className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(profile);
      }}
    >
      <div className="flex min-h-[13rem] flex-col xl:h-[15rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
          Step 1
        </p>
        <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-slate-950">
          Choose your conference focus
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Tell us what you want from the event and we will favor sessions that
          fit your themes, preferred format, speaker interests, and schedule.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
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

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Topics from the conference catalog
          </span>
          <select
            multiple
            value={profile.keywords}
            onChange={(event) =>
              updateField("keywords", getSelectedOptions(event))
            }
            className="min-h-40 rounded-2xl border border-slate-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-orange-400"
          >
            {filters.keywords.map((keyword) => (
              <option key={keyword} value={keyword}>
                {keyword}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Hold Ctrl or Cmd to choose multiple topics.
          </p>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Speakers you want to follow
          </span>
          <select
            multiple
            value={profile.preferredSpeakers}
            onChange={(event) =>
              updateField("preferredSpeakers", getSelectedOptions(event))
            }
            className="min-h-48 rounded-2xl border border-slate-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-orange-400"
          >
            {filters.speakers.map((speaker) => (
              <option key={speaker} value={speaker}>
                {speaker}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Maximum duration (minutes)
          </span>
          <input
            type="number"
            min="1"
            value={profile.maxDurationMinutes}
            onChange={(event) =>
              updateField("maxDurationMinutes", event.target.value)
            }
            placeholder="45"
            className="rounded-2xl border border-slate-200 bg-amber-50/60 px-4 py-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-orange-400"
          />
        </label>

        <fieldset className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Preferred time of day
          </span>
          <div className="flex flex-wrap gap-2">
            {TIME_PREFERENCES.map((option) => (
              <button
                key={option.value || "any"}
                type="button"
                className={
                  profile.timePreference === option.value
                    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-amber-50"
                    : "rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5"
                }
                onClick={() => updateField("timePreference", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        className="mt-6 inline-flex rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isLoading}
      >
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
    <fieldset className="grid gap-2">
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={
              selectedValues.includes(option)
                ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-amber-50"
                : "rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5"
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
