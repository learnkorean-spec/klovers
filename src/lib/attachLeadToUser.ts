import { supabase } from "@/integrations/supabase/client";

/**
 * Links an existing lead record to the authenticated user via user_id.
 * Called once after login/signup. Safe to call multiple times (idempotent).
 */
export async function attachLeadToUser(user: { id: string; email?: string }) {
  if (!user.email) return;
  const email = user.email.toLowerCase().trim();

  try {
    // Find lead with matching email that has no user_id yet
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .ilike("email", email)
      .is("user_id", null)
      .limit(1)
      .maybeSingle();

    if (lead?.id) {
      await supabase
        .from("leads")
        .update({ user_id: user.id })
        .eq("id", lead.id);
    }
  } catch (err) {
    console.error("attachLeadToUser error:", err);
  }
}
