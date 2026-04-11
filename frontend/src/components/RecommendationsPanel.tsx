import type { RecommendationResult } from "../lib/types";

interface RecommendationsPanelProps {
  recommendations: RecommendationResult[];
  agendaIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  onAdd: (sessionId: string) => void;
  onAddAll: () => void;
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
}: RecommendationsPanelProps): JSX.Element {
  const canAddAny = recommendations.some(
    (session) => !agendaIds.includes(session.session_id),
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
          Step 2
        </p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-slate-950">
              Sessions worth a closer look
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              These sessions line up best with the interests and time signals you
              selected. Save individual sessions or add the whole set to sketch
              out a first pass of your agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddAll}
            disabled={!canAddAny || isSaving}
            className="inline-flex self-start whitespace-nowrap rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Add all returned sessions"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          Matching sessions to your preferences...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No sessions matched yet. Broaden a few choices and try again.
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {recommendations.map((session, index) => {
            const alreadySaved = agendaIds.includes(session.session_id);
            return (
              <article
                key={session.session_id}
                className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-amber-50/60 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                      #{index + 1}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {session.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                    Score {session.score.toFixed(2)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {session.track} • {session.talk_type} • {session.level}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatScheduleLabel(
                    session.scheduled_at,
                    session.duration_minutes,
                  )}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {session.description || "No session description provided."}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Speakers: {session.speakers || "TBD"}
                </p>
                <button
                  className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
