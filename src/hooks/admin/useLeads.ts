import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages, DEFAULT_PAGE_SIZE } from "@/lib/fetch-all-pages";
import type { Lead, OverviewRow } from "@/types/admin";

interface UseLeadsOptions {
  /** Overview rows used to auto-derive lead status (enrolled/contacted). */
  overviewByEmail?: Record<string, OverviewRow>;
}

/**
 * Fetches CRM leads with optional status enrichment from the student overview.
 * The enrichment is a pure transform — no extra network call.
 *
 * Paged rather than capped: this was a bare `.limit(500)`, and the New Leads
 * badge is a count over this array, so past 500 leads it would have stopped
 * moving with no error.
 *
 * The `.order("id")` is load-bearing: offset paging needs a total ordering, and
 * `created_at` is not unique across bulk-imported leads.
 *
 * ON THE STATUS REWRITE BELOW
 * It is why New Leads reads 64 while `leads` holds 65 rows with status='new'.
 * One of those 65 already has an enrollment against their email, so the stored
 * status is stale and the badge is right. This is working as intended.
 */
export function useLeads({ overviewByEmail }: UseLeadsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () =>
      fetchAllPages<Lead>((from, to) =>
        supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to) as unknown as PromiseLike<{ data: Lead[] | null; error: { message: string } | null }>,
        DEFAULT_PAGE_SIZE,
      ),
    staleTime: 2 * 60 * 1000,
    select: (leads) => {
      if (!overviewByEmail) return leads;
      return leads.map((lead) => {
        // Guard the lookup key. `lead.email?.toLowerCase()` is `undefined` for
        // a lead with no email, and indexing an object with undefined coerces
        // to the STRING "undefined" — which buildOverviewByEmail can genuinely
        // have as a key if any overview row has a null email. Every email-less
        // lead would then match that one row and silently inherit its status.
        const key = lead.email?.toLowerCase();
        if (!key) return lead;

        const ov = overviewByEmail[key];
        if (!ov) return lead;

        let autoStatus = lead.status;
        if (["ACTIVE", "COMPLETED", "LOCKED"].includes(String(ov.derived_status))) {
          autoStatus = "enrolled";
        } else if (ov.enrollment_id) {
          autoStatus = "contacted";
        }
        return { ...lead, status: autoStatus };
      });
    },
  });
}
