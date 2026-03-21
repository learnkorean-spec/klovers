import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

export type PostType =
  | "group_opening"
  | "limited_seats_alert"
  | "new_class_opportunity"
  | "private_opening"
  | "weekend_class";

export interface TeacherAvailabilitySlot {
  teacherId: string;
  dayOfWeek: number;      // 0 = Sunday … 6 = Saturday
  startTime: string;      // HH:MM
  isAvailable: boolean;
  classType?: "group" | "private";
}

export interface AvailableClassSlot extends TeacherAvailabilitySlot {
  packageId?: string;
  level?: string;
  durationMin?: number;
  seatsAvailable?: number;
  capacity?: number;
  nextDate: string;       // YYYY-MM-DD — next upcoming occurrence
  postType: PostType;
}

export interface SlotPostDraft {
  id: string;             // deterministic: `${dayOfWeek}-${startTime}-${level}`
  title: string;
  subtitle: string;
  extraText: string;
  cta: string;
  caption: string;
  format: "instagram_post" | "instagram_story" | "facebook_post";
  date: string;           // YYYY-MM-DD
  time: string;           // formatted "6:00 PM"
  rawTime: string;        // HH:MM for scheduling
  dayName: string;
  level: string;
  classType: "group" | "private";
  seatsAvailable: number | null;
  postType: PostType;
  packageId?: string;
  approved: boolean;
  addedToCalendar: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

/** Returns the next calendar date (YYYY-MM-DD) for a given day-of-week (0=Sun) */
export function nextDateForDayOfWeek(dayOfWeek: number): string {
  const today = new Date();
  const todayDow = today.getDay();
  let diff = dayOfWeek - todayDow;
  if (diff <= 0) diff += 7;   // always in the future
  const target = new Date(today);
  target.setDate(today.getDate() + diff);
  return target.toISOString().split("T")[0];
}

function levelLabel(level: string): string {
  if (!level) return "Korean Class";
  const map: Record<string, string> = {
    beginner_1: "Beginner Level 1",
    beginner_2: "Beginner Level 2",
    elementary_1: "Elementary Level 1",
    elementary_2: "Elementary Level 2",
    intermediate_1: "Intermediate Level 1",
    intermediate_2: "Intermediate Level 2",
    upper_intermediate: "Upper Intermediate",
    advanced: "Advanced",
  };
  return map[level] || level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function derivePostType(slot: TeacherAvailabilitySlot & { seatsAvailable?: number; packageId?: string; dayOfWeek: number }): PostType {
  if (slot.classType === "private") return "private_opening";
  if (slot.dayOfWeek === 5 || slot.dayOfWeek === 6) return "weekend_class"; // Fri/Sat
  if (!slot.packageId) return "new_class_opportunity";
  if (slot.seatsAvailable !== undefined && slot.seatsAvailable <= 3) return "limited_seats_alert";
  return "group_opening";
}

function buildCaption(slot: AvailableClassSlot): string {
  const lvl = levelLabel(slot.level || "");
  const day = DAY_NAMES[slot.dayOfWeek];
  const time = formatTime12(slot.startTime);
  const urgent = slot.seatsAvailable !== undefined && slot.seatsAvailable <= 3;

  if (slot.postType === "limited_seats_alert") {
    return `⚡ Only ${slot.seatsAvailable} seat${slot.seatsAvailable === 1 ? "" : "s"} left in our ${lvl} class!\n📅 ${day} at ${time}\n\nDon't miss your chance to join. Spots fill fast!\n\n👉 Register now at kloversegy.com/enroll-now\n\n#LearnKorean #Klovers #KoreanCourse #LimitedSeats`;
  }
  if (slot.postType === "private_opening") {
    return `🎯 Private Korean lessons available — ${day} at ${time}!\n\nGet 1-on-1 attention and learn at your own pace. Perfect for all levels.\n\n👉 Book your spot at kloversegy.com/enroll-now\n\n#PrivateKorean #Klovers #LearnKorean`;
  }
  if (slot.postType === "new_class_opportunity") {
    return `🆕 New Korean class opening ${day} at ${time}!\n\nBe the first to join and shape the class from day one.\n\n👉 Secure your spot at kloversegy.com/enroll-now\n\n#NewClass #LearnKorean #Klovers`;
  }
  if (slot.postType === "weekend_class") {
    return `🇰🇷 Weekend Korean class — ${day} at ${time}!\n\n${lvl} — the perfect way to learn Korean without disrupting your week.\n\n👉 Enroll at kloversegy.com/enroll-now\n\n#WeekendKorean #Klovers #LearnKorean`;
  }
  // default group_opening
  return `🇰🇷 Join our ${lvl} class — ${day} at ${time}!\n\n${slot.seatsAvailable ? `${slot.seatsAvailable} seats available.` : "Limited seats."} Live interactive sessions with expert guidance.\n\n👉 Register at kloversegy.com/enroll-now\n\n#LearnKorean #Klovers #KoreanCourse${urgent ? " #LimitedSeats" : ""}`;
}

// ── Core engine ────────────────────────────────────────────────────────────

/** Fetch all available teacher slots from the DB */
export async function getTeacherAvailability(): Promise<TeacherAvailabilitySlot[]> {
  const { data, error } = await (supabase as any)
    .from("teacher_availability")
    .select("teacher_id, day_of_week, start_time, is_available, course_type")
    .eq("is_available", true)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    console.warn("teacher_availability fetch failed:", error.message);
    return [];
  }

  return (data || []).map((r: any) => ({
    teacherId: r.teacher_id,
    dayOfWeek: r.day_of_week,
    startTime: r.start_time,
    isAvailable: r.is_available,
    classType: (r.course_type as "group" | "private") || "group",
  }));
}

/** Cross-reference availability slots with schedule_packages to find open slots */
export async function getAvailableClassSlots(
  availabilitySlots: TeacherAvailabilitySlot[]
): Promise<AvailableClassSlot[]> {
  if (!availabilitySlots.length) return [];

  // Fetch all active schedule_packages
  const { data: packages } = await supabase
    .from("schedule_packages")
    .select("id, level, day_of_week, start_time, duration_min, capacity, course_type, is_active")
    .eq("is_active", true);

  // Fetch member counts per package via pkg_groups
  const pkgIds = (packages || []).map((p: any) => p.id);
  let memberCounts: Record<string, number> = {};

  if (pkgIds.length > 0) {
    const { data: groups } = await (supabase as any)
      .from("pkg_groups")
      .select("id, package_id, capacity")
      .in("package_id", pkgIds)
      .eq("is_active", true);

    const groupIds = (groups || []).map((g: any) => g.id);
    if (groupIds.length > 0) {
      const { data: members } = await (supabase as any)
        .from("pkg_group_members")
        .select("group_id")
        .in("group_id", groupIds)
        .eq("member_status", "active");

      (members || []).forEach((m: any) => {
        memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      });

      // Roll up to package level
      const pkgCounts: Record<string, number> = {};
      (groups || []).forEach((g: any) => {
        pkgCounts[g.package_id] = (pkgCounts[g.package_id] || 0) + (memberCounts[g.id] || 0);
      });
      memberCounts = pkgCounts;
    }
  }

  // Build a lookup: day_of_week + start_time → package
  const pkgBySlot = new Map<string, any>();
  (packages || []).forEach((p: any) => {
    pkgBySlot.set(`${p.day_of_week}-${p.start_time}`, p);
  });

  const result: AvailableClassSlot[] = [];

  for (const slot of availabilitySlots) {
    const pkg = pkgBySlot.get(`${slot.dayOfWeek}-${slot.startTime}`);
    const seatsAvailable = pkg
      ? Math.max(0, (pkg.capacity || 0) - (memberCounts[pkg.id] || 0))
      : undefined;

    // Skip fully-booked slots
    if (pkg && seatsAvailable === 0) continue;

    const postType = derivePostType({ ...slot, seatsAvailable, packageId: pkg?.id });

    result.push({
      ...slot,
      packageId: pkg?.id,
      level: pkg?.level || "",
      durationMin: pkg?.duration_min,
      seatsAvailable: seatsAvailable !== undefined ? seatsAvailable : null,
      capacity: pkg?.capacity,
      nextDate: nextDateForDayOfWeek(slot.dayOfWeek),
      postType,
    });
  }

  return result;
}

/** Generate a SlotPostDraft for each available slot */
export function generatePostsFromAvailableSlots(slots: AvailableClassSlot[]): SlotPostDraft[] {
  const seen = new Set<string>();
  return slots
    .map((slot): SlotPostDraft => {
      const lvl = levelLabel(slot.level || "");
      const day = DAY_NAMES[slot.dayOfWeek];
      const time = formatTime12(slot.startTime);
      const id = `${slot.dayOfWeek}-${slot.startTime}-${slot.level || "general"}`;

      const caption = buildCaption(slot);

      return {
        id,
        title: `${lvl} — ${day} ${time}`,
        subtitle: `Starting ${day} ${time}`,
        extraText: "#LearnKorean #Klovers",
        cta: "Register Now",
        caption,
        format: "instagram_post",
        date: slot.nextDate,
        time,
        rawTime: slot.startTime,
        dayName: day,
        level: slot.level || "",
        classType: slot.classType || "group",
        seatsAvailable: slot.seatsAvailable !== undefined ? slot.seatsAvailable : null,
        postType: slot.postType,
        packageId: slot.packageId,
        approved: false,
        addedToCalendar: false,
      };
    })
    .filter(draft => {
      // De-duplicate by id
      if (seen.has(draft.id)) return false;
      seen.add(draft.id);
      return true;
    });
}

/** Persist generated drafts to scheduled_social_posts (with status=draft) */
export async function saveGeneratedDrafts(
  drafts: SlotPostDraft[],
  campaignName: string,
  userId: string
): Promise<{ saved: number; errors: number }> {
  let saved = 0, errors = 0;

  for (const draft of drafts) {
    const scheduled_at = `${draft.date}T${draft.rawTime || "10:00"}:00+02:00`;
    const { error } = await supabase.from("scheduled_social_posts").insert({
      scheduled_at,
      course_title: campaignName,
      caption: draft.caption,
      platforms: ["instagram", "facebook"],
      status: "draft",
      created_by: userId,
      registration_url: `https://kloversegy.com/enroll-now?utm_source=social&utm_medium=post&utm_campaign=${encodeURIComponent(draft.title)}`,
    } as any);

    if (error) { console.error("save draft error:", error.message); errors++; }
    else saved++;
  }

  return { saved, errors };
}
