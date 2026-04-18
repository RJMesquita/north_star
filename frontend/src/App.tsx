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

const SHOW_ANONYMIZATION_NOTICE =
  import.meta.env.VITE_SHOW_ANONYMIZATION_NOTICE === "true";

function withProfileDefaults(profile: UserProfile | null): UserProfile {
  return {
    ...EMPTY_PROFILE,
    ...(profile ?? {}),
  };
}

export function App(): JSX.Element {
  const [filters, setFilters] = useState<FilterOptions>({
    tracks: [],
    talk_types: [],
    levels: [],
    keywords: [],
    speakers: [],
  });
  const [profile, setProfile] = useState<UserProfile>(
    withProfileDefaults(loadProfile()),
  );
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
      setIsFiltersLoading(true);
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
        const result = await checkAgendaConflicts(
          sessionId,
          [...workingAgendaIds],
        );
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.28),transparent_20%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.18),transparent_22%),linear-gradient(180deg,#120a30_0%,#18103b_36%,#1e1447_100%)] px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
              <img
                src="/logo-mark.png"
                alt="North Star"
                className="h-14 w-14 shrink-0 rounded-[1.2rem] border border-white/10 bg-white/8 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_18px_40px_rgba(168,85,247,0.24)] sm:h-16 sm:w-16"
              />
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-cyan-300 sm:text-[0.82rem]">
                  North Star
                </p>
                <p className="mt-1 text-sm text-indigo-100/70 sm:text-base">
                  Conference Personal Schedule Optimization
                </p>
              </div>
          </div>
          <div className="w-full rounded-[1.6rem] border border-white/10 bg-white/[0.045] px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-6 sm:py-5">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex items-center gap-3 self-start rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_0_6px_rgba(34,211,238,0.12)]" />
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-cyan-200">
                  Conference scheduling, aligned
                </p>
              </div>
              <aside className="max-w-md rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:w-[22rem] lg:shrink-0">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_0_6px_rgba(34,211,238,0.18)]" />
                  <p className="text-sm leading-6 text-indigo-50/85">{message}</p>
                </div>
              </aside>
            </div>
            <h1 className="mt-4 max-w-[24ch] font-['Space_Grotesk'] text-[2.7rem] font-semibold leading-[0.92] text-white sm:text-[3.35rem] lg:max-w-[25ch] lg:text-[4.05rem]">
              Build a conference plan from the sessions that matter most.
            </h1>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-cyan-300/60 via-fuchsia-400/30 to-transparent" />
            <p className="mt-4 max-w-[66ch] text-sm leading-7 text-indigo-100/78 sm:text-[1.02rem] sm:leading-8">
              Compare talks by theme, speaker, session style, and timing, then
              save the strongest options into a plan you can review, export,
              and carry into the event.
            </p>
            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="rounded-[1.35rem] border border-white/8 bg-slate-950/20 px-4 py-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-indigo-100/45">
                  Prototype Notice
                </p>
                <p className="mt-2 text-sm leading-6 text-indigo-100/62">
                  This is an independent hackathon project and not an official
                  Data Makers Fest application.
                </p>
                <p className="text-sm leading-6 text-indigo-100/52">
                  It uses conference workbook data for prototyping, and staging
                  content may change.
                </p>
              </div>
              {SHOW_ANONYMIZATION_NOTICE ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-300/16 bg-cyan-300/8 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cyan-200/90">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  Speaker names are anonymized in this staging environment
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {isFiltersLoading ? (
          <main className="mt-5 rounded-[2rem] border border-dashed border-white/15 bg-white/6 p-12 text-center text-sm text-indigo-100/70">
            Loading conference filters...
          </main>
        ) : (
          <main className="mt-5 grid gap-5 xl:grid-cols-3">
            <ProfileForm
              filters={filters}
              initialProfile={profile}
              isLoading={isRecommendationsLoading}
              onSubmit={(nextProfile) => {
                void handleProfileSubmit(nextProfile);
              }}
              showAnonymizationNotice={SHOW_ANONYMIZATION_NOTICE}
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
              showAnonymizationNotice={SHOW_ANONYMIZATION_NOTICE}
            />
            <AgendaPanel
              sessions={agendaSessions}
              onDownloadMarkdown={() => downloadAgendaMarkdown(agendaSessions)}
              onDownloadIcs={() => downloadAgendaIcs(agendaSessions)}
              onRemove={handleRemoveFromAgenda}
            />
          </main>
        )}

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/10 px-1 py-6 text-sm text-indigo-100/65 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-mark.png"
              alt="North Star"
              className="h-10 w-10 rounded-xl bg-white/6 p-1 opacity-90"
            />
            <div>
              <p className="font-medium text-indigo-50">North Star</p>
              <p>Data source: Data Makers Fest 2026 session workbook.</p>
            </div>
          </div>
          <div className="max-w-xl space-y-1">
            <p>
              Your saved agenda stays in this browser until you export it or
              clear local storage.
            </p>
            <p className="text-xs text-indigo-100/45">
              Independent hackathon prototype. Not an official Data Makers Fest
              product. Workbook-derived staging content may change.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
