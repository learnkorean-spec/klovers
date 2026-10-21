/**
 * Data access for the public "Teach with Klovers" application intake
 * (supabase/migrations/20261021113000_teacher_applications.sql). Read by
 * admins in TeacherOnboardingManager.tsx's "Applications" view.
 *
 * Deliberately separate from useTeacherOnboarding.ts's teachers roster:
 * accepting an application calls useCreateTeacher() from that file and then
 * marks this row accepted, but nothing here writes to `teachers` directly —
 * an admin always makes that call.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ApplicationStatus = "new" | "reviewing" | "accepted" | "rejected";

export interface TeacherApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  course_levels: string[];
  years_experience: string | null;
  message: string | null;
  status: ApplicationStatus;
  admin_notes: string | null;
  created_teacher_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const KEY = ["admin", "teacher-applications"] as const;

export function useTeacherApplications() {
  return useQuery<TeacherApplication[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeacherApplication[];
    },
    staleTime: 30 * 1000,
  });
}

/** Set status/admin_notes without creating a teacher row — used for "mark as reviewing" and "reject". */
export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: ApplicationStatus;
      admin_notes?: string | null;
    }) => {
      const patch: Record<string, unknown> = { status };
      if (admin_notes !== undefined) patch.admin_notes = admin_notes;
      if (status === "accepted" || status === "rejected") patch.reviewed_at = new Date().toISOString();
      const { error } = await supabase.from("teacher_applications").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Called after a teacher row has been created from this application, so the application keeps a record of where it led. */
export function useLinkApplicationToTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, teacherId }: { applicationId: string; teacherId: string }) => {
      const { error } = await supabase
        .from("teacher_applications")
        .update({ status: "accepted", created_teacher_id: teacherId, reviewed_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
