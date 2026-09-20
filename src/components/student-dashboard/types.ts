// Shared shapes for the Student Dashboard's extracted sub-components. Lived
// as private interfaces inside StudentDashboard.tsx before the page was
// split into per-component files; pulled out here so every piece that needs
// them (the dashboard page itself, AttendanceHistoryCard, KoreanLevelCard)
// imports the same definition instead of each declaring its own copy.

export interface AttendanceDate {
  date: string;
  source: string;
}

export interface PlacementTestResult {
  score: number;
  level: string;
  created_at: string;
}
