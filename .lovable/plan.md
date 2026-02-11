
# Update Teaching Team Section & Replace Hero Video

## Overview
Two changes: (1) Redesign the "Meet Your Teacher" section into a professional academy-style "Meet Our Teaching Team" section with updated content and a 2-column layout, and (2) replace the hero video with a fresh, higher-quality cinematic video.

## Changes

### 1. Update Translations (`src/i18n/translations.ts`)

**English `teacher` section** -- update to:
- `title`: "Meet Our Teaching Team"
- `name`: "Reham Elshrkawy"
- `bio`: The 4-paragraph professional academy description provided
- `highlights`: Updated to "2,000+ Students", "Structured Curriculum", "Professional Teaching Team"

**Arabic `teacher` section** -- matching Arabic translations for the new content.

### 2. Redesign `MeetTeacher.tsx` Component

Transform from centered single-column to a clean 2-column layout:

- **Left column**: Section title, the full multi-paragraph bio text, and highlight badges displayed as inline pill/badge elements
- **Right column**: A larger teacher avatar/illustration area with a decorative background shape
- Improved spacing (`py-24`), visual hierarchy with the title left-aligned above the text
- Highlight badges styled as small rounded pills with icons (Users, BookOpen, Award) for a professional look
- Fully responsive: stacks to single column on mobile
- Keep the existing Card-based highlight grid below the 2-column area as an alternative, or integrate badges inline -- will use inline badges for a cleaner look

### 3. Replace Hero Video

Generate a new high-quality cinematic video of South Korea (temples, city streets, cultural scenes) and replace `src/assets/hero-korea-video.mp4`. No code changes needed in `HeroSection.tsx` since it already imports from this path.

## Technical Details

- **Files modified**: `src/i18n/translations.ts`, `src/components/MeetTeacher.tsx`, `src/assets/hero-korea-video.mp4`
- **No new dependencies** required
- Uses existing Badge component from `src/components/ui/badge.tsx` for highlight pills
- Maintains RTL compatibility through the existing language context system
- The bio will be split into multiple paragraphs using separate translation keys (`bio1`, `bio2`, `bio3`, `bio4`) for cleaner rendering
