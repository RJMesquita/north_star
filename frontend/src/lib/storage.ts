import type { UserProfile } from "./types";

const PROFILE_STORAGE_KEY = "schedulize.profile";
const AGENDA_STORAGE_KEY = "schedulize.agenda";

export function loadProfile(): UserProfile | null {
  const rawValue = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as UserProfile;
  } catch {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadAgendaIds(): string[] {
  const rawValue = localStorage.getItem(AGENDA_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as string[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    localStorage.removeItem(AGENDA_STORAGE_KEY);
    return [];
  }
}

export function saveAgendaIds(sessionIds: string[]): void {
  localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(sessionIds));
}
