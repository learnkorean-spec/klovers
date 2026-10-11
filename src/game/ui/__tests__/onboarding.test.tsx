import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ControlsCard, ObjectiveChip, WelcomeCard } from "../Onboarding";
import { WORLD_COPY, type WorldLang } from "../../config/copy";
import { OBJECTIVE_ORDER, currentObjective, type ObjectiveId } from "../../config/objectives";

/**
 * The world's first-visit teaching, pinned. Two of these are the kind of thing
 * that only breaks in front of a learner — a phone that is told to press Shift,
 * or a language with a missing string — and neither shows up in a build.
 *
 * The touch branch cannot be checked by screenshotting here, because
 * `isTouchFirst()` reads `(pointer: coarse)`, which needs real device
 * emulation. So the contract is asserted directly instead: what a phone is
 * taught, and what it must never be taught.
 */

const LANGS: WorldLang[] = ["en", "ar"];
/** Caps that are a physical key on a keyboard: never translated, never on a phone. */
const REAL_KEYS = ["W", "A", "S", "D", "E", "Shift"];
/** A cap that is a device rather than a key may legitimately be translated
 *  (Arabic says الفأرة for the mouse). Single letters and Shift may not. */
const isPhysicalKey = (cap: string) => /^[A-Za-z]$/.test(cap) || cap === "Shift";

/** The caps the card actually renders, rather than any letter in the prose. */
const caps = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("kbd")).map((k) => (k.textContent ?? "").trim());

describe("world onboarding — touch tells a phone, and only a phone", () => {
  it("never teaches a keyboard key on a touch device", () => {
    const { container } = render(
      <ControlsCard lang="en" isTouch step="done" replay onClose={vi.fn()} />,
    );
    const shown = caps(container);
    for (const key of REAL_KEYS) {
      expect(shown).not.toContain(key);
    }
    // And it does teach the things a phone actually has.
    expect(shown).toContain("Left joystick");
    expect(shown).toContain("Drag the screen");
    expect(shown).toContain("Round button");
    // There is no running row at all on a phone, because running is Shift.
    expect(WORLD_COPY.en.onboarding.touch.map((r) => r.id)).not.toContain("run");
  });

  it("does teach the keyboard on a desktop", () => {
    const { container } = render(
      <ControlsCard lang="en" isTouch={false} step="done" replay onClose={vi.fn()} />,
    );
    const shown = caps(container);
    for (const key of REAL_KEYS) {
      expect(shown).toContain(key);
    }
    expect(shown).not.toContain("Left joystick");
  });

  it("keeps key caps left-to-right in Arabic, so WASD is never mirrored", () => {
    const { container } = render(
      <ControlsCard lang="ar" isTouch={false} step="done" replay onClose={vi.fn()} />,
    );
    // The row that holds the keys declares dir="ltr" regardless of language.
    expect(container.querySelectorAll('[dir="ltr"]').length).toBeGreaterThan(0);
    const shown = caps(container);
    expect(shown.slice(0, 4)).toEqual(["W", "A", "S", "D"]);
  });
});

describe("world onboarding — taught one step at a time", () => {
  it("shows movement (and running) first, and camera second", () => {
    const first = render(<ControlsCard lang="en" isTouch={false} step="move" onClose={vi.fn()} replay={false} />);
    expect(first.container.textContent).toContain("W");
    expect(first.container.textContent).toContain("Shift");
    expect(first.container.textContent).not.toContain("Mouse");
    first.unmount();

    const second = render(<ControlsCard lang="en" isTouch={false} step="look" onClose={vi.fn()} replay={false} />);
    expect(second.container.textContent).toContain("Mouse");
    expect(second.container.textContent).not.toContain("Shift");
  });

  it("fades itself out once both are done, instead of leaving the list on screen", () => {
    const { container } = render(
      <ControlsCard lang="en" isTouch={false} step="done" replay={false} onClose={vi.fn()} />,
    );
    expect(container.firstElementChild?.className).toContain("opacity-0");
  });

  it("comes back in full from the help button", () => {
    const { container } = render(
      <ControlsCard lang="en" isTouch={false} step="done" replay onClose={vi.fn()} />,
    );
    expect(container.firstElementChild?.className).toContain("opacity-100");
    expect(container.textContent).toContain("Interact");
  });
});

describe("world onboarding — the welcome and the objective", () => {
  it("welcomes in both languages and the button starts the visit", () => {
    const onStart = vi.fn();
    for (const lang of LANGS) {
      const { unmount } = render(<WelcomeCard lang={lang} onStart={onStart} avatar="adam" onAvatar={() => {}} view="eyes" onView={() => {}} />);
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByText(WORLD_COPY[lang].onboarding.welcomeTitle)).toBeTruthy();
      const cta = screen.getByRole("button", { name: WORLD_COPY[lang].onboarding.letsGo });
      cta.click();
      unmount();
    }
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("shows one small objective, and nothing at all when there is none", () => {
    const { unmount } = render(
      <ObjectiveChip lang="en" objective="meetCharacters" justDone={null} />,
    );
    expect(screen.getByText(WORLD_COPY.en.objective.meetCharacters)).toBeTruthy();
    expect(screen.getByText(WORLD_COPY.en.objective.label)).toBeTruthy();
    unmount();

    const none = render(<ObjectiveChip lang="en" objective={null} justDone={null} />);
    expect(none.container.firstChild).toBeNull();
  });

  it("names the finished objective briefly rather than jumping straight on", () => {
    render(<ObjectiveChip lang="en" objective="readSign" justDone="meetCharacters" />);
    expect(screen.getByText(WORLD_COPY.en.objective.meetCharacters)).toBeTruthy();
    expect(screen.getByText(WORLD_COPY.en.objective.done)).toBeTruthy();
  });
});

describe("world onboarding — copy is complete in both languages", () => {
  it("has every screen string in English and Arabic, with no blanks", () => {
    for (const lang of LANGS) {
      const c = WORLD_COPY[lang].onboarding;
      for (const [field, value] of Object.entries(c)) {
        if (typeof value === "string") expect(value.trim(), `${lang}.onboarding.${field}`).not.toBe("");
      }
      for (const list of [c.desktop, c.touch]) {
        expect(list.length).toBeGreaterThan(0);
        for (const row of list) {
          expect(row.label.trim()).not.toBe("");
          expect(row.keys.length).toBeGreaterThan(0);
          for (const k of row.keys) expect(k.trim()).not.toBe("");
        }
      }
    }
  });

  it("teaches the same controls in both languages", () => {
    const en = WORLD_COPY.en.onboarding;
    const ar = WORLD_COPY.ar.onboarding;
    expect(ar.desktop.map((r) => r.id)).toEqual(en.desktop.map((r) => r.id));
    expect(ar.touch.map((r) => r.id)).toEqual(en.touch.map((r) => r.id));
    // A physical key is not translated — W is W in Arabic. A device may be:
    // Arabic says الفأرة for the mouse, which is the better word for it.
    for (const lang of LANGS) {
      for (const list of [WORLD_COPY[lang].onboarding.desktop, WORLD_COPY[lang].onboarding.touch]) {
        for (const row of list) {
          for (const cap of row.keys) {
            if (isPhysicalKey(cap) || /^[A-Za-z]{2,}$/.test(cap)) {
              const englishRow = WORLD_COPY.en.onboarding.desktop.find((r) => r.id === row.id);
              const englishCap = englishRow?.keys[row.keys.indexOf(cap)];
              if (englishCap && isPhysicalKey(englishCap)) expect(cap).toBe(englishCap);
            }
          }
        }
      }
    }
  });

  it("has a name and a line for every objective in both languages", () => {
    const ids: ObjectiveId[] = [...OBJECTIVE_ORDER, "helpBaker"];
    for (const lang of LANGS) {
      for (const id of ids) {
        const line = (WORLD_COPY[lang].objective as Record<string, string>)[id];
        expect(line, `${lang}.objective.${id}`).toBeTruthy();
        expect(line.trim()).not.toBe("");
      }
      expect(WORLD_COPY[lang].objective.label.trim()).not.toBe("");
      expect(WORLD_COPY[lang].objective.done.trim()).not.toBe("");
    }
  });
});

describe("world onboarding — objectives follow real progress, not clicks", () => {
  it("starts at meeting the characters and moves on only when one is done", () => {
    const fresh = { met: [], done: [] as ObjectiveId[] };
    expect(currentObjective(fresh)).toBe("meetCharacters");
    expect(currentObjective({ met: ["friend"], done: ["meetCharacters"] })).toBe("readSign");
    expect(currentObjective({ met: [], done: ["meetCharacters", "readSign"] })).toBe("findHub");
  });

  it("only offers the market job once the learner's level actually opens the market", () => {
    const finished = { met: ["friend", "minsu"], done: [...OBJECTIVE_ORDER] as ObjectiveId[] };
    expect(currentObjective(finished, false)).toBeNull();
    expect(currentObjective(finished, true)).toBe("helpBaker");
  });

  it("gives up rather than inventing work when everything is done", () => {
    const all = { met: [], done: [...OBJECTIVE_ORDER, "helpBaker"] as ObjectiveId[] };
    expect(currentObjective(all, true)).toBeNull();
  });
});
