import type {
  ConflictCheckResult,
  FilterOptions,
  RecommendationRequest,
  RecommendationResult,
  Session,
} from "./types";

const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function getFilterOptions(): Promise<FilterOptions> {
  return apiRequest<FilterOptions>("/sessions/filters");
}

export function getSessions(ids: string[]): Promise<Session[]> {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }

  const params = new URLSearchParams();
  ids.forEach((id) => params.append("ids", id));
  return apiRequest<Session[]>(`/sessions?${params.toString()}`);
}

export function getRecommendations(
  request: RecommendationRequest,
): Promise<RecommendationResult[]> {
  return apiRequest<RecommendationResult[]>("/recommendations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function checkAgendaConflicts(
  candidateSessionId: string,
  agendaSessionIds: string[],
): Promise<ConflictCheckResult> {
  return apiRequest<ConflictCheckResult>("/agenda/check-conflicts", {
    method: "POST",
    body: JSON.stringify({
      candidate_session_id: candidateSessionId,
      agenda_session_ids: agendaSessionIds,
    }),
  });
}
