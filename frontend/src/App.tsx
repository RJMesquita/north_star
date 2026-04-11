import { useEffect, useState } from "react";

import { AgendaPanel } from "./components/AgendaPanel";
import { ProfileForm } from "./components/ProfileForm";
import { RecommendationsPanel } from "./components/RecommendationsPanel";
import { downloadAgendaIcs, downloadAgendaMarkdown } from "./lib/export";
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
    keywords: [],
    speakers: [],
  });
  const [profile, setProfile] = useState<UserProfile>(loadProfile() ?? EMPTY_PROFILE);
  const [agendaIds, setAgendaIds] = useState<string[]>(loadAgendaIds());
  const [agendaSessions, setAgendaSessions] = useState<Session[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [isAgendaSaving, setIsAgendaSaving] = useState(false);
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
        setMessage("Unable to refresh your saved agenda from the backend.");
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

  function buildSessionLookup(): Map<string, string> {
    return new Map(
      [...recommendations, ...agendaSessions].map((session) => [
        session.session_id,
        session.title,
      ]),
    );
  }

  async function saveSessionsToAgenda(sessionIds: string[]): Promise<void> {
    const candidateIds = sessionIds.filter((sessionId) => !agendaIds.includes(sessionId));
    if (candidateIds.length === 0) {
      setMessage("Everything in this list is already saved to your agenda.");
      return;
    }

    setIsAgendaSaving(true);

    try {
      const workingAgendaIds = [...agendaIds];
      const conflictingCandidateIds: string[] = [];
      const sessionLookup = buildSessionLookup();

      for (const sessionId of candidateIds) {
        const result = await checkAgendaConflicts(sessionId, [...workingAgendaIds]);
        if (result.has_conflict) {
          conflictingCandidateIds.push(sessionId);
          continue;
        }

        workingAgendaIds.push(sessionId);
      }

      let nextAgendaIds = [...new Set(workingAgendaIds)];
      if (conflictingCandidateIds.length > 0) {
        const conflictingTitles = conflictingCandidateIds
          .map((sessionId) => sessionLookup.get(sessionId) ?? sessionId)
          .join(", ");
        const confirmed = window.confirm(
          [
            `${conflictingCandidateIds.length} session(s) overlap with your agenda.`,
            `Add them anyway?`,
            conflictingTitles,
          ].join(" "),
        );
        if (!confirmed) {
          setAgendaIds(nextAgendaIds);
          saveAgendaIds(nextAgendaIds);
          setMessage(
            `Added ${nextAgendaIds.length - agendaIds.length} session(s) without overlaps.`,
          );
          return;
        }

        nextAgendaIds = [
          ...new Set([...nextAgendaIds, ...conflictingCandidateIds]),
        ];
      }

      setAgendaIds(nextAgendaIds);
      saveAgendaIds(nextAgendaIds);
      setMessage(
        `Added ${nextAgendaIds.length - agendaIds.length} session(s) to your agenda.`,
      );
    } catch (error) {
      setMessage("We could not update your agenda right now.");
    } finally {
      setIsAgendaSaving(false);
    }
  }

  async function handleAddToAgenda(sessionId: string): Promise<void> {
    await saveSessionsToAgenda([sessionId]);
  }

  async function handleAddAllToAgenda(): Promise<void> {
    await saveSessionsToAgenda(recommendations.map((session) => session.session_id));
  }

  function handleRemoveFromAgenda(sessionId: string): void {
    const nextAgendaIds = agendaIds.filter((id) => id !== sessionId);
    setAgendaIds(nextAgendaIds);
    saveAgendaIds(nextAgendaIds);
    setMessage("Session removed from your agenda.");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.35),transparent_24%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_24%),linear-gradient(180deg,#fff9ee_0%,#f8fafc_54%,#eef2ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
              Schedulize
            </p>
            <h1 className="mt-2 max-w-xl font-['Space_Grotesk'] text-4xl font-semibold leading-none text-slate-950 sm:text-6xl">
              Build a conference schedule you can actually follow.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Compare talks by theme, speaker, session style, and timing, then
              save the best options into a plan you can keep, share, and import
              into your calendar.
            </p>
          </div>
          <aside className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_0_6px_rgba(249,115,22,0.18)]" />
              <p className="text-sm leading-6 text-slate-600">{message}</p>
            </div>
          </aside>
        </header>

        {isFiltersLoading ? (
          <main className="mt-6 rounded-[2rem] border border-dashed border-slate-200 bg-white/70 p-12 text-center text-sm text-slate-500">
            Loading conference filters...
          </main>
        ) : (
          <main className="mt-6 grid gap-5 xl:grid-cols-3">
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
              isSaving={isAgendaSaving}
              onAdd={(sessionId) => {
                void handleAddToAgenda(sessionId);
              }}
              onAddAll={() => {
                void handleAddAllToAgenda();
              }}
            />
            <AgendaPanel
              sessions={agendaSessions}
              onDownloadMarkdown={() => downloadAgendaMarkdown(agendaSessions)}
              onDownloadIcs={() => downloadAgendaIcs(agendaSessions)}
              onRemove={handleRemoveFromAgenda}
            />
          </main>
        )}

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 px-1 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Data source: Data Makers Fest 2026 session workbook.</p>
          <p>
            Your saved agenda stays in this browser until you export it or clear
            local storage.
          </p>
        </footer>
      </div>
    </div>
  );
}
