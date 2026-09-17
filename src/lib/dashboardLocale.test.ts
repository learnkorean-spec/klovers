import { describe, expect, it } from "vitest";
import { badgeText, leagueName, localizeClock } from "./dashboardLocale";
import { BADGES, LEAGUES } from "@/constants/gamification";

describe("dashboardLocale", () => {
  it("turns AM/PM into ص/م only in Arabic", () => {
    expect(localizeClock("7:05 PM", "ar")).toBe("7:05 م");
    expect(localizeClock("9:00 AM", "ar")).toBe("9:00 ص");
    expect(localizeClock("7:05 PM", "en")).toBe("7:05 PM");
  });
  it("has an Arabic name for every league and badge", () => {
    for (const l of LEAGUES) expect(leagueName(l, "ar")).not.toBe(l.name);
    for (const b of BADGES) expect(badgeText(b, "ar").name).not.toBe(b.name);
    expect(leagueName(LEAGUES[0], "en")).toBe(LEAGUES[0].name);
  });
});
