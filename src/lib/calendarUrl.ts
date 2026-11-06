/**
 * Build a Google Calendar "Add Event" URL.
 * No API key needed — opens a pre-filled event creation page.
 */
export function buildGoogleCalendarUrl(params: {
  title: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  durationMin: number;
  description: string;
  timezone: string;
  /**
   * The actual room the class happens in (Google Meet link, etc). Without
   * this, the calendar event carries no meeting link of its own — Google
   * Calendar then shows "Join with Google Meet" and silently mints its OWN
   * brand-new Meet room when the event is saved, which is NOT the room the
   * teacher is actually using. That mismatch (calendar link != email link)
   * is exactly what this field exists to prevent, so always pass it when
   * a meeting_url is known.
   */
  location?: string | null;
}): string {
  const { title, date, time, durationMin, description, timezone, location } = params;
  const [h, m] = time.split(":").map(Number);
  const dateClean = date.replace(/-/g, "");
  const start = `${dateClean}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const endH = h + Math.floor((m + durationMin) / 60);
  const endM = (m + durationMin) % 60;
  const end = `${dateClean}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

  // Put the room in both the description and the location field: `location`
  // is what Google shows prominently and what most "Join" buttons read, but
  // some calendar clients (and ICS exports downstream) only surface details.
  const fullDescription = location && location.trim()
    ? `${description}\n\nJoin: ${location.trim()}`
    : description;

  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: fullDescription,
    ctz: timezone,
  });
  if (location && location.trim()) {
    qs.set("location", location.trim());
  }
  return `https://calendar.google.com/calendar/render?${qs.toString()}`;
}

/** Format "18:00" → "6:00 PM" */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_ABBREV_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};
