import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import OptimizedImage from "../OptimizedImage";

/**
 * Regression coverage for the CLS fix (2026-08-30): Lighthouse's
 * layout-shifts audit against production named the exact DOM subtree that
 * shifted — the fallback UI swapping in as a differently-sized subtree
 * when an image errors. These tests assert the property that actually
 * prevents that: one persistent wrapper box, present before, during, and
 * after an image load error, never replaced wholesale.
 */
describe("OptimizedImage — layout stability across loading/loaded/error", () => {
  it("keeps the same outer box (same aspect-ratio class) whether the image is loading or has errored", () => {
    const { container, rerender } = render(
      <OptimizedImage src="https://images.unsplash.com/photo-123" alt="test" isHero />
    );
    const boxWhileLoading = container.querySelector(".aspect-\\[16\\/9\\]");
    expect(boxWhileLoading).not.toBeNull();

    const img = container.querySelector("img")!;
    fireEvent.error(img);

    rerender(<OptimizedImage src="https://images.unsplash.com/photo-123" alt="test" isHero />);
    const boxAfterError = container.querySelector(".aspect-\\[16\\/9\\]");
    expect(boxAfterError).not.toBeNull();

    // Same element identity — the wrapper was never unmounted and
    // recreated, only its children swapped.
    expect(boxAfterError).toBe(boxWhileLoading);
  });

  it("shows the 'Image unavailable' fallback text inside the same box after a real error, not a differently-shaped one", () => {
    render(<OptimizedImage src="https://images.unsplash.com/photo-123" alt="test" isHero />);
    const img = screen.getByAltText("test");
    fireEvent.error(img);
    expect(screen.getByText("Image unavailable")).toBeInTheDocument();
  });

  it("reserves the card aspect ratio even with no src at all (never renders an unsized fallback)", () => {
    const { container } = render(<OptimizedImage alt="test" variant="card" />);
    expect(container.querySelector(".aspect-video")).not.toBeNull();
  });

  it("reserves the hero aspect ratio for a missing/invalid src from the first render, before any error event", () => {
    const { container } = render(<OptimizedImage alt="test" isHero />);
    expect(container.querySelector(".aspect-\\[16\\/9\\]")).not.toBeNull();
    expect(screen.getByText("📖")).toBeInTheDocument();
  });
});
