/**
 * Fixture is the live data on 26 Nov 2026, including the rows that must NOT
 * show up (stale signups) and the duplicate that must collapse (Naira, Mariam
 * have both a bundle and legacy enrollment rows).
 */
import { describe, it, expect } from "vitest";
import { buildBoard, boardTiles, willEmailOnPaid, type BoardInput } from "@/lib/paymentsBoard";

const enr = (id: string, user: string, pay: string, left: number, total: number, over = {}) => ({
  id, user_id: user, payment_status: pay, approval_status: "APPROVED",
  enrollment_status: "active", sessions_remaining: left, sessions_total: total,
  created_at: "2026-11-14T00:00:00Z", ...over,
});
const bundle = (id: string, name: string, user: string | null, left: number, total: number, paid: string | null) => ({
  student_id: id, user_id: user, full_name: name, subject: "korean", label: "x",
  total_classes: total, remaining_classes: left, paid_on: paid, note: null,
});

const input: BoardInput = {
  enrollments: [
    enr("e-aya", "u-aya", "PAID", 1, 4),
    enr("e-yas", "u-yas", "PAID", 2, 4),
    enr("e-heba", "u-heba", "PAID", 2, 4),
    enr("e-yas-old", "u-yas", "PENDING_PAYMENT", 0, 0),        // stale duplicate
    enr("e-stale", "u-stale", "PENDING_PAYMENT", 0, 0),         // stale signup
    enr("e-mariam", "u-mariam", "PAID", 4, 4),                  // legacy, bundle wins
    enr("e-naira", "u-naira", "PENDING_PAYMENT", 0, 0),         // legacy, bundle wins
  ],
  members: [
    { enrollment_id: "e-aya", user_id: "u-aya", member_status: "active", group_name: "Hangul Fri" },
    { enrollment_id: "e-yas", user_id: "u-yas", member_status: "active", group_name: "Hangul Fri" },
    { enrollment_id: "e-heba", user_id: "u-heba", member_status: "active", group_name: "Hangul Fri" },
  ],
  profileNames: { "u-aya": "Aya Arafa", "u-yas": "Yasmeen", "u-heba": "HebaTallah" },
  bundles: [
    bundle("s1", "Solafa and Lamar", "u-sol", 7, 16, "2026-11-12"),
    bundle("s2", "Mariam", "u-mariam", 1, 4, "2026-09-21"),
    bundle("s3", "Menna", "u-menna", 0, 4, "2026-10-26"),
    bundle("s4", "Naira", "u-naira", 0, 4, "2026-11-26"),
    bundle("s5", "Renad Elsenduony", "u-renad", 6, 12, "2026-09-28"),
    bundle("s6", "Namy", "u-namy", 1, 3, "2026-11-02"),
  ],
};

describe("payments board", () => {
  const rows = buildBoard(input);
  const by = (n: string) => rows.find((r) => r.name === n)!;

  it("shows 9 students, one row each, no stale rows", () => {
    expect(rows).toHaveLength(9);
  });

  it.each([
    ["Aya Arafa", 1, 4], ["Yasmeen", 2, 4], ["HebaTallah", 2, 4], ["Naira", 0, 4],
    ["Solafa and Lamar", 7, 16], ["Mariam", 1, 4], ["Menna", 0, 4],
    ["Renad Elsenduony", 6, 12], ["Namy", 1, 3],
  ])("%s has %i of %i left and is paid", (n, left, total) => {
    expect(by(n).left).toBe(left);
    expect(by(n).total).toBe(total);
    expect(by(n).payment).toBe("paid");
  });

  it("sorts fewest left first", () => {
    const lefts = rows.map((r) => r.left);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
  });

  it("computes the tiles", () => {
    expect(boardTiles(rows)).toEqual({ active: 9, paid: 9, unpaid: 0, needBundle: 2, oneLeft: 3 });
  });

  it("puts cancelled at the bottom and out of the tiles", () => {
    const withCancelled = buildBoard({
      ...input,
      enrollments: [...input.enrollments, enr("e-c", "u-c", "PAID", 0, 4, { enrollment_status: "cancelled" })],
      members: [...input.members, { enrollment_id: "e-c", user_id: "u-c", member_status: "active", group_name: "G" }],
      profileNames: { ...input.profileNames, "u-c": "Zed" },
    });
    expect(withCancelled[withCancelled.length - 1].payment).toBe("cancelled");
    expect(boardTiles(withCancelled).active).toBe(9);
  });

  it("marks a seated but unpaid group student unpaid", () => {
    const r = buildBoard({
      ...input,
      enrollments: [enr("e-u", "u-u", "PENDING_PAYMENT", 4, 4)],
      members: [{ enrollment_id: "e-u", user_id: "u-u", member_status: "active", group_name: "G" }],
      profileNames: { "u-u": "Una" }, bundles: [],
    });
    expect(r[0].payment).toBe("unpaid");
  });

  it("adds up a student's active bundles instead of keeping the last one", () => {
    const r = buildBoard({
      ...input,
      enrollments: [], members: [], profileNames: {},
      bundles: [
        bundle("s9", "Dina", "u-dina", -1, 4, "2026-10-01"),   // overdrawn old bundle
        bundle("s9", "Dina", "u-dina", 4, 4, "2026-11-20"),    // the new one
      ],
    });
    expect(r).toHaveLength(1);
    expect(r[0].left).toBe(3);
    expect(r[0].total).toBe(8);
    expect(r[0].payment).toBe("paid");
  });

  it("is unpaid when any active bundle is unpaid", () => {
    const r = buildBoard({
      ...input, enrollments: [], members: [], profileNames: {},
      bundles: [bundle("s9", "Dina", "u-dina", 0, 4, "2026-10-01"), bundle("s9", "Dina", "u-dina", 4, 4, null)],
    });
    expect(r[0].payment).toBe("unpaid");
  });

  it("keeps two students without an account apart", () => {
    const r = buildBoard({
      ...input, enrollments: [], members: [], profileNames: {},
      bundles: [bundle("s7", "A", null, 2, 4, "2026-10-01"), bundle("s8", "B", null, 3, 4, "2026-10-01")],
    });
    expect(r).toHaveLength(2);
  });

  describe("mark paid", () => {
    const unpaid = (over = {}) =>
      buildBoard({
        ...input,
        enrollments: [enr("e-u", "u-u", "PENDING_PAYMENT", 4, 4, { currency: "USD", ...over })],
        members: [{ enrollment_id: "e-u", user_id: "u-u", member_status: "active", group_name: "G" }],
        profileNames: { "u-u": "Una" }, bundles: [],
      })[0];

    it("offers it on a seated, approved, unpaid group row", () => {
      const r = unpaid();
      expect(r.enrollmentId).toBe("e-u");
      expect(r.currency).toBe("USD");
    });

    it("does not offer it on paid rows or bundle rows", () => {
      expect(rows.every((r) => r.enrollmentId === undefined)).toBe(true);
    });

    it("does not offer it when the enrollment is not approved", () => {
      expect(unpaid({ approval_status: "PENDING" }).enrollmentId).toBeUndefined();
    });

    it("does not offer it on a cancelled row", () => {
      expect(unpaid({ enrollment_status: "cancelled" }).enrollmentId).toBeUndefined();
    });

    it("defaults the currency to EGP", () => {
      expect(unpaid({ currency: null }).currency).toBe("EGP");
    });

    it("predicts the email from the trigger rule", () => {
      const e = enr("x", "u", "PENDING_PAYMENT", 4, 4);
      expect(willEmailOnPaid(e)).toBe(true);
      expect(willEmailOnPaid({ ...e, approval_email_sent_at: "2026-11-01" })).toBe(false);
      expect(willEmailOnPaid({ ...e, payment_email_sent_at: "2026-11-01" })).toBe(false);
      expect(willEmailOnPaid({ ...e, payment_email_sent_at: "2026-11-01", matched_at: "2026-11-02" })).toBe(true);
    });
  });
});
