import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TapCluby } from "@/components/TapCluby";

vi.mock("@/lib/tracking", () => ({ track: { custom: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/cloudVoice", () => ({ cloudVoiceFits: () => false, playCloudKorean: vi.fn() }));

const wrap = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <TapCluby src="/assets/cluby/cluby-wave.webp" alt="Cluby waving hello" />
      </MemoryRouter>
    </LanguageProvider>,
  );

describe("TapCluby", () => {
  it("is a real button and says nothing until tapped", () => {
    wrap();
    expect(screen.getByRole("button", { name: /Cluby waving hello/ })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a Korean line with its reading and meaning on tap", () => {
    wrap();
    fireEvent.click(screen.getByRole("button", { name: /Cluby/ }));
    const note = screen.getByRole("status");
    expect(note.textContent).toMatch(/[가-힣]/);
    expect(note.querySelector('[lang="ko"]')).toBeTruthy();
  });

  it("gets dizzy after five quick taps", () => {
    wrap();
    const btn = screen.getByRole("button", { name: /Cluby/ });
    for (let i = 0; i < 5; i++) fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toContain("어지러워요");
  });
});
