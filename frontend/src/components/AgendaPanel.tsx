import type { Session } from "../lib/types";

interface AgendaPanelProps {
  sessions: Session[];
  onDownloadMarkdown: () => void;
  onDownloadIcs: () => void;
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

function formatTimeRange(session: Session): string {
  if (!session.scheduled_at) {
    return "Time TBD";
  }

  const startDate = new Date(session.scheduled_at);
  const startLabel = startDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const endLabel = session.ends_at
    ? new Date(session.ends_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

function groupSessionsByDay(sessions: Session[]): Array<[string, Session[]]> {
  const groupedSessions = new Map<string, Session[]>();

  sortByStartTime(sessions).forEach((session) => {
    const key = session.scheduled_at
      ? new Date(session.scheduled_at).toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      : "Schedule TBD";
    const existingSessions = groupedSessions.get(key) ?? [];
    existingSessions.push(session);
    groupedSessions.set(key, existingSessions);
  });

  return Array.from(groupedSessions.entries());
}

export function AgendaPanel({
  sessions,
  onDownloadMarkdown,
  onDownloadIcs,
  onRemove,
}: AgendaPanelProps): JSX.Element {
  const sessionsByDay = groupSessionsByDay(sessions);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex min-h-[13rem] min-w-0 flex-col xl:h-[15rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Step 3
        </p>
        <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
          See your plan on the calendar
        </h2>
        <p className="mt-4 text-sm leading-6 text-indigo-100/75">
          Your saved sessions are arranged by day and time so it is easier to
          spot clashes, tighten gaps, and leave with something you can use.
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button
            type="button"
            onClick={onDownloadMarkdown}
            disabled={sessions.length === 0}
            className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-50 transition hover:-translate-y-0.5 hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Markdown
          </button>
          <button
            type="button"
            onClick={onDownloadIcs}
            disabled={sessions.length === 0}
            className="inline-flex whitespace-nowrap rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download ICS
          </button>
        </div>
      </div>

      {sessionsByDay.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center text-sm text-indigo-100/65">
          Save sessions from the recommendations list to see your schedule take
          shape.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 2xl:grid-cols-2">
          {sessionsByDay.map(([day, daySessions]) => (
            <section
              key={day}
              className="min-w-0 rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/12 to-sky-400/8 p-5"
            >
              <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-white">
                {day}
              </h3>
              <div className="mt-4 grid gap-4">
                {daySessions.map((session) => (
                  <article
                    key={session.session_id}
                    className="grid min-w-0 gap-3 rounded-3xl border border-white/10 bg-slate-950/30 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.18)] md:grid-cols-[7rem_minmax(0,1fr)]"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-cyan-300">
                        {formatTimeRange(session)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-indigo-100/40">
                        {session.duration_minutes
                          ? `${session.duration_minutes} min`
                          : "TBD"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h4 className="break-words text-base font-semibold text-white">
                            {session.title}
                          </h4>
                          <p className="mt-1 break-words text-sm text-indigo-100/70">
                            {session.track} • {session.talk_type} • {session.level}
                          </p>
                        </div>
                        <button
                          className="inline-flex self-start whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-50 transition hover:-translate-y-0.5 hover:bg-white/16"
                          type="button"
                          onClick={() => onRemove(session.session_id)}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-3 break-words text-sm text-indigo-50/85">
                        {session.speakers || "Speaker details unavailable."}
                      </p>
                      <p className="mt-2 text-xs text-indigo-100/55">
                        {formatAgendaTime(session)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
