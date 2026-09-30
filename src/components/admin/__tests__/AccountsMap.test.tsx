/**
 * Admin → Accounts map.
 *
 * The promises made to Re: the filter ("github") shows only those accounts
 * with their login email on top, and the editor refuses anything that looks
 * like a password or key — the map keeps logins only.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

const rows = [
  { id: "1", service: "GitHub · learnkorean-spec", login: "owner@example.com", detail: "Merge account", url: "https://github.com", status: "active", sort_order: 10, updated_at: "" },
  { id: "2", service: "Vercel", login: "owner@example.com", detail: "Deploys", url: null, status: "active", sort_order: 11, updated_at: "" },
  { id: "3", service: "Resend", login: "mail@example.com", detail: "Emails", url: null, status: "active", sort_order: 20, updated_at: "" },
  { id: "4", service: "GitHub · dev-account", login: "dev-account (GitHub)", detail: "Developer", url: null, status: "active", sort_order: 40, updated_at: "" },
  { id: "5", service: "Stripe", login: "", detail: "Shop", url: null, status: "active", sort_order: 50, updated_at: "" },
];

const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

vi.mock("@/integrations/supabase/client", () => {
  const order2 = vi.fn(() => Promise.resolve({ data: rows, error: null }));
  const order1 = vi.fn(() => ({ order: order2 }));
  return {
    supabase: {
      from: () => ({
        select: () => ({ order: order1 }),
        update: (...a: unknown[]) => update(...a),
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    },
  };
});

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ toast: (...a: unknown[]) => toastSpy(...a) }));

import AccountsMap from "../AccountsMap";

describe("AccountsMap", () => {
  beforeEach(() => { update.mockClear(); toastSpy.mockClear(); });

  it("groups accounts under the login that opens them", async () => {
    render(<AccountsMap />);
    await screen.findByText("Accounts map");
    const tree = within(screen.getByTestId("accounts-tree"));
    expect(tree.getByText("owner@example.com")).toBeInTheDocument();
    expect(tree.getByText("Login not recorded")).toBeInTheDocument();
    expect(tree.getByText("Vercel")).toBeInTheDocument();
  });

  it("filter 'github' shows only GitHub accounts with their logins", async () => {
    render(<AccountsMap />);
    await screen.findByText("Accounts map");
    fireEvent.change(screen.getByLabelText("Filter accounts"), { target: { value: "github" } });
    const tree = within(screen.getByTestId("accounts-tree"));
    expect(tree.getByText("GitHub · learnkorean-spec")).toBeInTheDocument();
    expect(tree.getByText("GitHub · dev-account")).toBeInTheDocument();
    expect(tree.getByText("owner@example.com")).toBeInTheDocument();
    expect(tree.queryByText("Vercel")).not.toBeInTheDocument();
    expect(tree.queryByText("Resend")).not.toBeInTheDocument();
    expect(tree.queryByText("mail@example.com")).not.toBeInTheDocument();
  });

  it("quick filter chip does the same with one tap", async () => {
    render(<AccountsMap />);
    await screen.findByText("Accounts map");
    fireEvent.click(screen.getByRole("button", { name: "Resend" }));
    const tree = within(screen.getByTestId("accounts-tree"));
    expect(tree.getByText("mail@example.com")).toBeInTheDocument();
    expect(tree.queryByText("owner@example.com")).not.toBeInTheDocument();
  });

  it("refuses to save a password or key", async () => {
    render(<AccountsMap />);
    await screen.findByText("Accounts map");
    fireEvent.click(screen.getByLabelText("Edit Stripe"));
    fireEvent.change(screen.getByPlaceholderText("e.g. name@gmail.com"), { target: { value: "sk_live_abcdefghijklmnop" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    expect(toastSpy.mock.calls[0][0].title).toMatch(/password or key/i);
    expect(update).not.toHaveBeenCalled();
  });
});
