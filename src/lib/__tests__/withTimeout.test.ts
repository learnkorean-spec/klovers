import { describe, it, expect } from "vitest";
import { withTimeout, TimeoutError, isServiceOutage } from "@/lib/withTimeout";

describe("withTimeout", () => {
  it("passes a fast result through", async () => {
    await expect(withTimeout(Promise.resolve(7), 50)).resolves.toBe(7);
  });
  it("rejects with TimeoutError when too slow", async () => {
    await expect(withTimeout(new Promise(() => {}), 10, "login")).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("isServiceOutage", () => {
  it("treats 5xx, timeouts and network failures as outages", () => {
    expect(isServiceOutage({ status: 504, message: "" })).toBe(true);
    expect(isServiceOutage(new TimeoutError())).toBe(true);
    expect(isServiceOutage(new TypeError("Failed to fetch"))).toBe(true);
    expect(isServiceOutage({ name: "AuthRetryableFetchError", message: "{}", status: 0 })).toBe(true);
  });
  it("does not treat a wrong password as an outage", () => {
    expect(isServiceOutage({ status: 400, message: "Invalid login credentials" })).toBe(false);
    expect(isServiceOutage(null)).toBe(false);
  });
});
