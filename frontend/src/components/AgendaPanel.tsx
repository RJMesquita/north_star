import type { Session } from "../lib/types";

interface AgendaPanelProps {
  sessions: Session[];
  onRemove: (sessionId: string) => void;
}

function sortByStartTime(sessions: Session[]): Session[] {
  return [...sessions].sort((first, second) => {
    const firstValue = first.scheduled_at ? new Date(first.scheduled_at).valueOf() : 0;
    const secondValue = second.scheduled_at
      ? new Date(second.scheduled_at).valueOf()
      : 0;
    return firstValue - secondValue;
  });
}

function formatAgendaTime(session: Session): string {
  if (!session.scheduled_at) {
    return "Schedule TBD";
  }

  return new Date(session.scheduled_at).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AgendaPanel({
  sessions,
  onRemove,
}: AgendaPanelProps): JSX.Element {
  const orderedSessions = sortByStartTime(sessions);

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Step 3</p>
        <h2>Your agenda</h2>
        <p>
          Agenda state is intentionally stored in the browser for the MVP. The
          backend only evaluates conflicts and hydrates session data.
        </p>
      </div>

      {orderedSessions.length === 0 ? (
        <div className="empty-state">
          Add recommended sessions to build a conflict-aware plan.
        </div>
      ) : (
        <div className="card-stack">
          {orderedSessions.map((session) => (
            <article key={session.session_id} className="agenda-card">
              <div className="session-card-header">
                <div>
                  <h3>{session.title}</h3>
                  <p className="session-meta">
                    {session.track} • {session.talk_type}
                  </p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => onRemove(session.session_id)}
                >
                  Remove
                </button>
              </div>
              <p className="session-meta">{formatAgendaTime(session)}</p>
              <p className="session-meta">
                {session.duration_minutes
                  ? `${session.duration_minutes} minutes`
                  : "Duration TBD"}
              </p>
              <p>{session.speakers || "Speaker details unavailable."}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
