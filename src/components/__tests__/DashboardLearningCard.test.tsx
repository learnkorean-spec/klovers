import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLearningCard from "../DashboardLearningCard";
import { LanguageProvider } from "@/contexts/LanguageContext";

const progressQuery = vi.fn();
const lessonsQuery = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) =>
      table === "student_lesson_progress" ? progressQuery() : lessonsQuery(),
  },
}));

function chain(data: unknown, error: { message: string } | null = null) {
  return {
    select: () => ({ eq: () => Promise.resolve({ data, error }) }),
  };
}

const renderCard = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <DashboardLearningCard userId="student-1" />
      </MemoryRouter>
    </LanguageProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardLearningCard — verified progress states", () => {
  it("renders the library entry point while loading", async () => {
    progressQuery.mockReturnValue(chain([]));
    lessonsQuery.mockReturnValue(chain([{ id: 1 }]));
    renderCard();
    expect(screen.getByText("Learning Library")).toBeInTheDocument();
    expect(screen.getByText("Loading learning progress…")).toBeInTheDocument();
    expect(await screen.findByText(/No saved lesson progress yet/)).toBeInTheDocument();
  });

  it("reports empty state without inventing progress", async () => {
    progressQuery.mockReturnValue(chain([]));
    lessonsQuery.mockReturnValue(chain([{ id: 1 }]));
    renderCard();
    await waitFor(() =>
      expect(screen.getByText(/No saved lesson progress yet/)).toBeInTheDocument()
    );
  });

  it("counts only published lessons as completed or in progress", async () => {
    progressQuery.mockReturnValue(
      chain([
        { lesson_id: 1, chapter_completed: true, vocab_done: true, grammar_done: true, dialogue_done: true, exercises_done: true, reading_done: true, writing_done: true },
        { lesson_id: 2, chapter_completed: false, vocab_done: true, grammar_done: false, dialogue_done: false, exercises_done: false, reading_done: false, writing_done: false },
        { lesson_id: 999, chapter_completed: true, vocab_done: true, grammar_done: true, dialogue_done: true, exercises_done: true, reading_done: true, writing_done: true },
      ])
    );
    lessonsQuery.mockReturnValue(chain([{ id: 1 }, { id: 2 }]));
    renderCard();
    await waitFor(() =>
      expect(
        screen.getByText("1 lessons completed · 1 in progress across your books.")
      ).toBeInTheDocument()
    );
  });

  it("offers a retry and never fabricates data after a query failure", async () => {
    progressQuery.mockReturnValueOnce(chain(null, { message: "network down" }));
    lessonsQuery.mockReturnValueOnce(chain([{ id: 1 }]));
    renderCard();
    expect(await screen.findByText(/couldn't load your progress/)).toBeInTheDocument();
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();

    progressQuery.mockReturnValue(chain([{ lesson_id: 1, chapter_completed: true, vocab_done: true, grammar_done: true, dialogue_done: true, exercises_done: true, reading_done: true, writing_done: true }]));
    lessonsQuery.mockReturnValue(chain([{ id: 1 }]));
    fireEvent.click(screen.getByRole("button", { name: "Retry progress" }));
    await waitFor(() =>
      expect(screen.getByText(/you've finished everything published so far/)).toBeInTheDocument()
    );
  });
});
