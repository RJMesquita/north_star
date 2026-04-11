import type { Session } from "./types";

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((first, second) => {
    const firstTime = first.scheduled_at ? new Date(first.scheduled_at).valueOf() : 0;
    const secondTime = second.scheduled_at
      ? new Date(second.scheduled_at).valueOf()
      : 0;
    return firstTime - secondTime;
  });
}

function formatDateLabel(value: string | null): string {
  if (!value) {
    return "Schedule TBD";
  }

  return new Date(value).toLocaleString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadAgendaMarkdown(sessions: Session[]): void {
  const orderedSessions = sortSessions(sessions);
  const lines = [
    "# My Schedulize Agenda",
    "",
    ...orderedSessions.flatMap((session) => [
      `## ${session.title}`,
      `- Track: ${session.track || "TBD"}`,
      `- Format: ${session.talk_type || "TBD"}`,
      `- Level: ${session.level || "TBD"}`,
      `- Speakers: ${session.speakers || "TBD"}`,
      `- Time: ${formatDateLabel(session.scheduled_at)}`,
      `- Duration: ${
        session.duration_minutes ? `${session.duration_minutes} minutes` : "TBD"
      }`,
      "",
      session.description || "No session description available.",
      "",
    ]),
  ];

  downloadTextFile(
    "schedulize-agenda.md",
    lines.join("\n"),
    "text/markdown;charset=utf-8",
  );
}

function formatIcsDate(value: string): string {
  return value.replace(/[-:]/g, "").replace(".000", "");
}

export function downloadAgendaIcs(sessions: Session[]): void {
  const orderedSessions = sortSessions(sessions).filter(
    (session) => session.scheduled_at && session.ends_at,
  );

  const eventBlocks = orderedSessions.map((session) => {
    const startValue = formatIcsDate(session.scheduled_at as string);
    const endValue = formatIcsDate(session.ends_at as string);
    return [
      "BEGIN:VEVENT",
      `UID:${session.session_id}@schedulize`,
      `DTSTAMP:${startValue}Z`,
      `DTSTART:${startValue}`,
      `DTEND:${endValue}`,
      `SUMMARY:${session.title}`,
      `DESCRIPTION:${(session.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${session.track}`,
      "END:VEVENT",
    ].join("\n");
  });

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Schedulize//Agenda Export//EN",
    ...eventBlocks,
    "END:VCALENDAR",
    "",
  ].join("\n");

  downloadTextFile(
    "schedulize-agenda.ics",
    content,
    "text/calendar;charset=utf-8",
  );
}
