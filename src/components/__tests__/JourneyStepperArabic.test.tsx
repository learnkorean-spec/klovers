import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JourneyStepper from "../JourneyStepper";
import { LanguageProvider } from "@/contexts/LanguageContext";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
afterEach(() => localStorage.clear());

describe("JourneyStepper", () => {
  it("renders Arabic labels and marks the current step", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    const { container } = render(<LanguageProvider><JourneyStepper currentStage={2} /></LanguageProvider>);
    expect(screen.getByText("نشط")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Registered|Enrolled|Active|Completed/);
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain("نشط");
  });
  it("keeps English labels in English", () => {
    render(<LanguageProvider><JourneyStepper currentStage={1} /></LanguageProvider>);
    expect(screen.getByText("Enrolled")).toBeInTheDocument();
  });
});
