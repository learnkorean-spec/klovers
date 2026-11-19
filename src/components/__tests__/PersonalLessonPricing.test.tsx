import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PersonalLessonPricing from "../PersonalLessonPricing";
import { tierPrices } from "@/lib/stripePrices";

const tr = (en: string) => en;

const renderPricing = () =>
  render(<PersonalLessonPricing tr={tr} id="pricing" ink="#111111" signal="#ffd400" />);

describe("PersonalLessonPricing", () => {
  it("shows private prices by default, derived from the canonical table", () => {
    renderPricing();
    expect(screen.getByRole("radio", { name: "Private (1:1)" })).toHaveAttribute("aria-checked", "true");
    const monthly = tierPrices.local.private[1];
    expect(screen.getByText(`$${monthly}/month, 4 lessons`)).toBeInTheDocument();
  });

  it("switches to group prices from the same table", () => {
    renderPricing();
    fireEvent.click(screen.getByRole("radio", { name: "Group" }));
    expect(screen.getByRole("radio", { name: "Group" })).toHaveAttribute("aria-checked", "true");
    const monthly = tierPrices.local.group[1];
    expect(screen.getByText(`$${monthly}/month, 4 lessons`)).toBeInTheDocument();
    expect(screen.getByText(/Days and times are set with you on the free call/)).toBeInTheDocument();
  });
});
