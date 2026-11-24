import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  },
}));

import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function Show() {
  const { language } = useLanguage();
  return <span data-testid="lang">{language}</span>;
}

const setBrowserLanguages = (langs: string[]) => {
  Object.defineProperty(window.navigator, "languages", { value: langs, configurable: true });
  Object.defineProperty(window.navigator, "language", { value: langs[0], configurable: true });
};

describe("first visit from an Arabic browser", () => {
  const original = { languages: navigator.languages, language: navigator.language };

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/free-trial?utm_source=telegram");
  });
  afterEach(() => setBrowserLanguages([...original.languages] as string[]));

  it("moves a page with an Arabic twin to /ar and shows Arabic, keeping the query", () => {
    setBrowserLanguages(["ar-EG", "en"]);
    render(<LanguageProvider><Show /></LanguageProvider>);
    expect(screen.getByTestId("lang").textContent).toBe("ar");
    expect(window.location.pathname).toBe("/ar/free-trial");
    expect(window.location.search).toBe("?utm_source=telegram");
  });

  it("leaves an English browser on the English page", () => {
    setBrowserLanguages(["en-US"]);
    render(<LanguageProvider><Show /></LanguageProvider>);
    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(window.location.pathname).toBe("/free-trial");
  });

  it("never overrides a language the visitor already chose", () => {
    localStorage.setItem("k-lovers-lang", "en");
    setBrowserLanguages(["ar-EG"]);
    render(<LanguageProvider><Show /></LanguageProvider>);
    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(window.location.pathname).toBe("/free-trial");
  });
});
