// Canonical keys for the student registration / profile-completion checklist
// shown on the dashboard. The literal string values are unchanged from what
// StudentDashboard.tsx, RegistrationChecklist.tsx and StudentPrimaryAction.tsx
// already hard-coded independently (and StudentDashboard's `?complete=` deep
// link still maps to these same values) — this just gives every consumer one
// named source instead of three copies of the same magic strings.
export const REGISTRATION_FIELD = {
  FULL_NAME: "Full name",
  KOREAN_LEVEL: "Korean level",
  COUNTRY: "Country",
  PREFERRED_DAYS: "Preferred class days",
  TIMEZONE: "Timezone",
} as const;

export type RegistrationFieldKey = (typeof REGISTRATION_FIELD)[keyof typeof REGISTRATION_FIELD];
