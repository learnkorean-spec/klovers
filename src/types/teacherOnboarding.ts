/**
 * Shared types for the teacher onboarding system.
 *
 * Mirrors the shape of supabase/migrations/20261021050526_teacher_onboarding.sql.
 * See that file for the full design rationale (why `teachers` is independent
 * of user_roles, why course_level_key uses '' rather than NULL, etc.).
 */

export type TeacherStatus = "onboarding" | "active" | "paused" | "offboarded";

export type CourseProgressStatus = "not_started" | "in_progress" | "ready" | "active";

export type OnboardingStepScope = "general" | "per_course";

/** Sentinel used in teacher_onboarding_progress.course_level_key for a general (once-per-teacher) step. */
export const GENERAL_SCOPE_KEY = "";

export interface Teacher {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: TeacherStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherCourseProgress {
  id: string;
  teacher_id: string;
  course_level_key: string;
  status: CourseProgressStatus;
  started_at: string | null;
  ready_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStep {
  id: string;
  key: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  scope: OnboardingStepScope;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface OnboardingProgress {
  id: string;
  teacher_id: string;
  step_id: string;
  /** '' for a general step; a course_levels.key for a per-course step. */
  course_level_key: string;
  is_done: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Everything the admin screen needs about one teacher, assembled client-side. */
export interface TeacherWithOnboarding extends Teacher {
  courseProgress: TeacherCourseProgress[];
  stepProgress: OnboardingProgress[];
}

export const TEACHER_STATUS_LABEL: Record<TeacherStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  paused: "Paused",
  offboarded: "Offboarded",
};

export const COURSE_PROGRESS_STATUS_LABEL: Record<CourseProgressStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  ready: "Ready",
  active: "Teaching",
};
