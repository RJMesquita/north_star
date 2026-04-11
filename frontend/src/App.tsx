import { useEffect, useState } from "react";

import { AgendaPanel } from "./components/AgendaPanel";
import { ProfileForm } from "./components/ProfileForm";
import { RecommendationsPanel } from "./components/RecommendationsPanel";
import {
  checkAgendaConflicts,
  getFilterOptions,
  getRecommendations,
  getSessions,
} from "./lib/api";
import {
  loadAgendaIds,
  loadProfile,
  saveAgendaIds,
  saveProfile,
} from "./lib/storage";
import type {
  FilterOptions,
  RecommendationResult,
  Session,
  UserProfile,
} from "./lib/types";

const EMPTY_PROFILE: UserProfile = {
  tracks: [],
  talkTypes: [],
  levels: [],
  keywords: [],
  preferredSpeakers: [],
  timePreference: "",
  maxDurationMinutes: "",
};

export function App(): JSX.Element {
  const [filters, setFilters] = useState<FilterOptions>({
    tracks: [],
    talk_types: [],
    levels: [],
  });
  const [profile, setProfile] = useState<UserProfile>(loadProfile() ?? EMPTY_PROFILE);
  const [agendaIds, setAgendaIds] = useState<string[]>(loadAgendaIds());
  const [agendaSessions, setAgendaSessions] = useState<Session[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [message, setMessage] = useState<string>(
    "Load your preferences to start building a schedule.",
  );

  useEffect(() => {
    void (async () => {
      try {
        const filterOptions = await getFilterOptions();
        setFilters(filterOptions);
      } catch (error) {
        setMessage(
          [
            "Unable to load conference metadata from the API.",
            "Start the backend and try again.",
          ].join(" "),
        );
      } finally {
        setIsFiltersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (agendaIds.length === 0) {
      setAgendaSessions([]);
      return;
    }

    void (async () => {
      try {
        const sessions = await getSessions(agendaIds);
        setAgendaSessions(sessions);
      } catch (error) {
        setMessage("Unable to hydrate the saved agenda from the backend.");
      }
    })();
  }, [agendaIds]);

  async function handleProfileSubmit(nextProfile: UserProfile): Promise<void> {
    setProfile(nextProfile);
    saveProfile(nextProfile);
    setIsRecommendationsLoading(true);
    setMessage("Running recommendation scoring...");

    try {
      const nextRecommendations = await getRecommendations({
        tracks: nextProfile.tracks,
        talk_types: nextProfile.talkTypes,
        levels: nextProfile.levels,
        keywords: nextProfile.keywords,
        preferred_speakers: nextProfile.preferredSpeakers,
        time_preference: nextProfile.timePreference || null,
        max_duration_minutes: nextProfile.maxDurationMinutes
          ? Number(nextProfile.maxDurationMinutes)
          : null,
        limit: 10,
      });
      setRecommendations(nextRecommendations);
      setMessage(`Loaded ${nextRecommendations.length} ranked sessions.`);
    } catch (error) {
      setMessage("Recommendation request failed. Check that the API is running.");
    } finally {
      setIsRecommendationsLoading(false);
    }
  }

  async function handleAddToAgenda(sessionId: string): Promise<void> {
    try {
      const result = await checkAgendaConflicts(sessionId, agendaIds);
      if (result.has_conflict) {
        const conflictingTitles = result.conflicting_sessions
          .map((session) => session.title)
          .join(", ");
        const confirmed = window.confirm(
          `This session overlaps with: ${conflictingTitles}. Add it anyway?`,
        );
        if (!confirmed) {
          return;
        }
      }

      const nextAgendaIds = [...new Set([...agendaIds, sessionId])];
      setAgendaIds(nextAgendaIds);
      saveAgendaIds(nextAgendaIds);
      setMessage("Session added to your agenda.");
    } catch (error) {
      setMessage("Conflict check failed. The agenda was not updated.");
    }
  }

  function handleRemoveFromAgenda(sessionId: string): void {
    const nextAgendaIds = agendaIds.filter((id) => id !== sessionId);
    setAgendaIds(nextAgendaIds);
    saveAgendaIds(nextAgendaIds);
    setMessage("Session removed from your agenda.");
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Schedulize Web MVP</p>
          <h1>Personalize the conference. Keep the schedule honest.</h1>
          <p className="hero-copy">
            This implementation follows the PRD's first meaningful web milestone:
            build profile-based recommendations, then let attendees save sessions
            into a conflict-aware local agenda without introducing accounts or
            server-side user state.
          </p>
        </div>
        <aside className="status-panel">
          <span className="status-dot" />
          <p>{message}</p>
        </aside>
      </header>

      {isFiltersLoading ? (
        <main className="loading-state">Loading conference filters...</main>
      ) : (
        <main className="layout-grid">
          <ProfileForm
            filters={filters}
            initialProfile={profile}
            isLoading={isRecommendationsLoading}
            onSubmit={(nextProfile) => {
              void handleProfileSubmit(nextProfile);
            }}
          />
          <RecommendationsPanel
            recommendations={recommendations}
            agendaIds={agendaIds}
            isLoading={isRecommendationsLoading}
            onAdd={(sessionId) => {
              void handleAddToAgenda(sessionId);
            }}
          />
          <AgendaPanel
            sessions={agendaSessions}
            onRemove={handleRemoveFromAgenda}
          />
        </main>
      )}
    </div>
  );
}
