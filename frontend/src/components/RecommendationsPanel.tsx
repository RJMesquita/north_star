import type { RecommendationResult } from "../lib/types";

interface RecommendationsPanelProps {
  recommendations: RecommendationResult[];
  agendaIds: string[];
  isLoading: boolean;
  onAdd: (sessionId: string) => void;
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
  onAdd,
}: RecommendationsPanelProps): JSX.Element {
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Step 2</p>
        <h2>Ranked recommendations</h2>
        <p>
          The backend returns a computed list rather than a stored resource, so
          this view reflects the result of the recommendation request body you
          submit from the profile form.
        </p>
      </div>

      {isLoading ? (
        <div className="empty-state">Scoring sessions against your profile...</div>
      ) : recommendations.length === 0 ? (
        <div className="empty-state">
          No sessions matched yet. Adjust filters or add broader keywords.
        </div>
      ) : (
        <div className="card-stack">
          {recommendations.map((session, index) => {
            const alreadySaved = agendaIds.includes(session.session_id);
            return (
              <article key={session.session_id} className="session-card">
                <div className="session-card-header">
                  <div>
                    <p className="rank-label">#{index + 1}</p>
                    <h3>{session.title}</h3>
                  </div>
                  <div className="score-chip">
                    Score {session.score.toFixed(2)}
                  </div>
                </div>
                <p className="session-meta">
                  {session.track} • {session.talk_type} • {session.level}
                </p>
                <p className="session-meta">
                  {formatScheduleLabel(
                    session.scheduled_at,
                    session.duration_minutes,
                  )}
                </p>
                <p>{session.description || "No session description provided."}</p>
                <p className="session-meta">Speakers: {session.speakers || "TBD"}</p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onAdd(session.session_id)}
                  disabled={alreadySaved}
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
