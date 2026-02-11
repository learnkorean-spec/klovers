
# Add Arabic/English Language Toggle

## Overview
Add a language switcher button to the header that toggles between English and Arabic, with full RTL support for Arabic. The button will show "العربية" when in English mode and "English" when in Arabic mode, matching the reference screenshot.

## What Will Change

### 1. Language Context (new file)
Create a React context (`src/contexts/LanguageContext.tsx`) to manage the current language state (`en` / `ar`) across the entire app. This will provide a `useLanguage()` hook and handle setting `dir="rtl"` on the HTML element when Arabic is selected.

### 2. Translations File (new file)
Create `src/i18n/translations.ts` containing all UI text in both English and Arabic, organized by section (header, hero, courses, pricing, enrollment, FAQ, footer).

### 3. Header Update
Add a language toggle button next to the "Enroll Now" CTA showing "العربية" or "English". Also available in the mobile menu.

### 4. Update All Sections
Replace hardcoded English text with translated strings from the translations file in:
- HeroSection
- WhyKLovers
- CoursesSection
- PricingSection
- EnrollSection
- FAQSection
- Footer

### 5. RTL Support
When Arabic is selected:
- Set `dir="rtl"` on the document
- Layout automatically mirrors thanks to Tailwind's logical properties
- Text alignment switches appropriately

## Technical Details

- **State management**: React Context with `useState`, persisted via `localStorage`
- **No new dependencies** needed -- pure React implementation
- **RTL handling**: Toggle `document.documentElement.dir` between `ltr` and `rtl`
- **Wrap `App` with `LanguageProvider`** so all components can access the language context
- All existing component files will be updated to use `useLanguage()` hook and pull text from the translations object
