import type { RecommendationResult } from "../lib/types";

interface RecommendationsPanelProps {
  recommendations: RecommendationResult[];
  agendaIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  onAdd: (sessionId: string) => void;
  onAddAll: () => void;
  showAnonymizationNotice?: boolean;
}

function formatScheduleLabel(
  startsAt: string | null,
  durationMinutes: number | null,
): string {
  if (!startsAt) {
    return "Schedule TBD";
  }

  const startDate = new Date(startsAt);
  const dateLabel = startDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!durationMinutes) {
    return dateLabel;
  }
  return `${dateLabel} • ${durationMinutes} min`;
}

export function RecommendationsPanel({
  recommendations,
  agendaIds,
  isLoading,
  isSaving,
  onAdd,
  onAddAll,
  showAnonymizationNotice = false,
}: RecommendationsPanelProps): JSX.Element {
  const canAddAny = recommendations.some(
    (session) => !agendaIds.includes(session.session_id),
  );

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex min-h-[13rem] flex-col xl:h-[15rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Step 2
        </p>
        <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
          Sessions worth a closer look
        </h2>
        <p className="mt-4 text-sm leading-6 text-indigo-100/75">
          These sessions line up best with the interests and time signals you
          selected. Save individual sessions or add the whole set to sketch
          out a first pass of your agenda.
        </p>
        {showAnonymizationNotice ? (
          <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full border border-cyan-300/16 bg-cyan-300/8 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Staging speaker names are anonymized
          </div>
        ) : null}
        <button
          type="button"
          onClick={onAddAll}
          disabled={!canAddAny || isSaving}
          className="mt-auto inline-flex self-start whitespace-nowrap rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Add all returned sessions"}
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-indigo-100/65">
          Matching sessions to your preferences...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-indigo-100/65">
          No sessions matched yet. Broaden a few choices and try again.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {recommendations.map((session, index) => {
            const alreadySaved = agendaIds.includes(session.session_id);
            return (
              <article
                key={session.session_id}
                className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/12 to-fuchsia-500/8 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      #{index + 1}
                    </p>
                    <h3 className="text-lg font-semibold text-white">
                      {session.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-200">
                    Score {session.score.toFixed(2)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-indigo-100/70">
                  {session.track} • {session.talk_type} • {session.level}
                </p>
                <p className="mt-1 text-sm text-indigo-100/70">
                  {formatScheduleLabel(
                    session.scheduled_at,
                    session.duration_minutes,
                  )}
                </p>
                <p className="mt-4 text-sm leading-6 text-indigo-50/85">
                  {session.description || "No session description provided."}
                </p>
                <p className="mt-3 text-sm text-indigo-100/70">
                  Speakers: {session.speakers || "TBD"}
                </p>
                <button
                  className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-50 transition hover:-translate-y-0.5 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => onAdd(session.session_id)}
                  disabled={alreadySaved || isSaving}
                >
                  {alreadySaved ? "Saved to agenda" : "Add to agenda"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
