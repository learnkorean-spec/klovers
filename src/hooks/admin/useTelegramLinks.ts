/**
 * Telegram links between students and @learnkoreanwithkloversbot.
 *
 * Each student gets a personal link (t.me/<bot>?start=<code>). When they press
 * Start, the telegram-webhook edge function stores their chat id in
 * public.telegram_links — that is what lets the bot message them later.
 * Private students are keyed by teacher_students.id, group students by their
 * auth user id.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// telegram_links is newer than the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const TELEGRAM_BOT_USERNAME = "learnkoreanwithkloversbot";

export type TelegramLinkTarget =
  | { kind: "private"; teacherStudentId: string }
  | { kind: "group"; userId: string };

export interface TelegramLinkRow {
  teacher_student_id: string | null;
  user_id: string | null;
  link_code: string;
  chat_id: number | null;
  tg_username: string | null;
  linked_at: string | null;
}

const KEY = ["admin", "telegram-links"] as const;

export const telegramStartUrl = (code: string) =>
  `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`;

/** All link rows, indexed for O(1) lookup per student card. */
export function useTelegramLinks() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await db
        .from("telegram_links")
        .select("teacher_student_id, user_id, link_code, chat_id, tg_username, linked_at");
      if (error) throw error;
      const byStudent = new Map<string, TelegramLinkRow>();
      const byUser = new Map<string, TelegramLinkRow>();
      for (const row of (data ?? []) as TelegramLinkRow[]) {
        if (row.teacher_student_id) byStudent.set(row.teacher_student_id, row);
        if (row.user_id) byUser.set(row.user_id, row);
      }
      return { byStudent, byUser };
    },
    // Students link from their phone while Re watches the page — keep it fresh.
    refetchInterval: 30_000,
  });
}

/** Get (or create) a student's personal link code. */
export function useTelegramLinkCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (target: TelegramLinkTarget): Promise<string> => {
      const { data, error } = await db.rpc("admin_telegram_link_code", {
        p_teacher_student_id: target.kind === "private" ? target.teacherStudentId : null,
        p_user_id: target.kind === "group" ? target.userId : null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.link_code) throw new Error("No link code returned");
      return row.link_code as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
