import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import type { RecommendationResult, Session } from "../lib/types";

vi.mock("../lib/api", () => ({
  getFilterOptions: vi.fn(),
  getRecommendations: vi.fn(),
  getSessions: vi.fn(),
  checkAgendaConflicts: vi.fn(),
}));

const api = await import("../lib/api");

const mockRecommendation: RecommendationResult = {
  session_id: "S1",
  title: "Production RAG Pipelines",
  description: "Build reliable retrieval augmented generation systems.",
  speakers: "Jane Doe",
  track: "Engineering",
  talk_type: "Technical",
  level: "Intermediate",
  keywords: "rag llm",
  scheduled_at: "2026-09-10T09:00:00",
  ends_at: "2026-09-10T09:45:00",
  duration_minutes: 45,
  score: 0.91,
};

const secondRecommendation: RecommendationResult = {
  session_id: "S2",
  title: "Responsible AI Program Design",
  description: "Frameworks for practical AI governance.",
  speakers: "Alex Roe",
  track: "Responsible AI",
  talk_type: "Applications",
  level: "Beginner",
  keywords: "ethics",
  scheduled_at: "2026-09-10T10:00:00",
  ends_at: "2026-09-10T10:45:00",
  duration_minutes: 45,
  score: 0.77,
};

const mockAgendaSession: Session = {
  session_id: "S1",
  title: "Production RAG Pipelines",
  description: "Build reliable retrieval augmented generation systems.",
  speakers: "Jane Doe",
  track: "Engineering",
  talk_type: "Technical",
  level: "Intermediate",
  keywords: "rag llm",
  scheduled_at: "2026-09-10T09:00:00",
  ends_at: "2026-09-10T09:45:00",
  duration_minutes: 45,
};

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));

    vi.mocked(api.getFilterOptions).mockResolvedValue({
      tracks: ["Engineering", "Responsible AI"],
      talk_types: ["Applications", "Technical"],
      levels: ["Beginner", "Intermediate"],
      keywords: ["rag", "ethics"],
      speakers: ["Jane Doe", "Alex Roe"],
    });
    vi.mocked(api.getRecommendations).mockResolvedValue([
      mockRecommendation,
      secondRecommendation,
    ]);
    vi.mocked(api.getSessions).mockResolvedValue([mockAgendaSession]);
    vi.mocked(api.checkAgendaConflicts).mockResolvedValue({
      candidate_session_id: "S1",
      has_conflict: false,
      conflicting_sessions: [],
    });
  });

  it("loads filters and renders the profile form", async () => {
    render(<App />);

    expect(await screen.findByText("Choose your conference focus")).toBeVisible();
    expect(screen.getByRole("button", { name: "Engineering" })).toBeVisible();
    expect(api.getFilterOptions).toHaveBeenCalled();
  });

  it("submits the profile and shows recommendations", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Choose your conference focus");
    await user.click(screen.getByRole("button", { name: "Engineering" }));
    await user.click(
      screen.getByRole("button", { name: "Get recommendations" }),
    );

    await waitFor(() => {
      expect(api.getRecommendations).toHaveBeenCalledWith({
        tracks: ["Engineering"],
        talk_types: [],
        levels: [],
        keywords: [],
        preferred_speakers: [],
        time_preference: null,
        max_duration_minutes: null,
        limit: 10,
      });
    });
    expect(await screen.findByText("Production RAG Pipelines")).toBeVisible();
  });

  it("adds a recommendation to the agenda and persists session ids", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Choose your conference focus");
    await user.click(screen.getByRole("button", { name: "Get recommendations" }));
    await screen.findByText("Production RAG Pipelines");

    await user.click(screen.getAllByRole("button", { name: "Add to agenda" })[0]);

    await waitFor(() => {
      expect(api.checkAgendaConflicts).toHaveBeenCalledWith("S1", []);
    });
    await waitFor(() => {
      expect(api.getSessions).toHaveBeenLastCalledWith(["S1"]);
    });
    expect(localStorage.getItem("schedulize.agenda")).toBe('["S1"]');
    expect(await screen.findAllByText("Production RAG Pipelines")).toHaveLength(2);
  });

  it("hydrates a saved agenda on first load", async () => {
    localStorage.setItem("schedulize.agenda", JSON.stringify(["S1"]));

    render(<App />);

    await waitFor(() => {
      expect(api.getSessions).toHaveBeenCalledWith(["S1"]);
    });
    expect(await screen.findByText("See your plan on the calendar")).toBeVisible();
  });

  it("adds all returned sessions to the agenda in one action", async () => {
    const user = userEvent.setup();
    vi.mocked(api.getSessions).mockResolvedValue([
      mockAgendaSession,
      {
        ...mockAgendaSession,
        session_id: "S2",
        title: "Responsible AI Program Design",
      },
    ]);

    render(<App />);

    await screen.findByText("Choose your conference focus");
    await user.click(screen.getByRole("button", { name: "Get recommendations" }));
    await screen.findByText("Production RAG Pipelines");
    await user.click(
      screen.getByRole("button", { name: "Add all returned sessions" }),
    );

    await waitFor(() => {
      expect(api.checkAgendaConflicts).toHaveBeenNthCalledWith(1, "S1", []);
      expect(api.checkAgendaConflicts).toHaveBeenNthCalledWith(2, "S2", ["S1"]);
    });
    expect(localStorage.getItem("schedulize.agenda")).toBe('["S1","S2"]');
  });
});
