export type TimePreference = "morning" | "afternoon" | "evening" | "";

export interface Session {
  session_id: string;
  title: string;
  description: string;
  speakers: string;
  track: string;
  talk_type: string;
  level: string;
  keywords: string;
  scheduled_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
}

export interface RecommendationResult extends Session {
  score: number;
}

export interface FilterOptions {
  tracks: string[];
  talk_types: string[];
  levels: string[];
  keywords: string[];
  speakers: string[];
}

export interface UserProfile {
  tracks: string[];
  talkTypes: string[];
  levels: string[];
  keywords: string[];
  preferredSpeakers: string[];
  timePreference: TimePreference;
  maxDurationMinutes: string;
}

export interface RecommendationRequest {
  tracks: string[];
  talk_types: string[];
  levels: string[];
  keywords: string[];
  preferred_speakers: string[];
  time_preference: string | null;
  max_duration_minutes: number | null;
  limit: number;
}

export interface ConflictCheckResult {
  candidate_session_id: string;
  has_conflict: boolean;
  conflicting_sessions: Session[];
}
