# Book 1 generator (A0 style)

`python3 build.py 05` reads `units/05.json` and writes `out/unit-05.pdf` (A5, cream #FFF9EC,
"الوحدة" instead of "الحصة", no class counts or minutes, footer "الصفحة N من M").
Needs `google-chrome` and the bundled fonts in `fonts/`. Icons come from `public/picture-library/icons`.
One JSON per unit: title, goals, vocab (icon id, Korean, Arabic), grammar, dialogue, practice.
Status: units 5-24 done. Units 1-4 still need their JSON.
- always use brand yellow #FFFF00 (no other yellows)
- layout rule: Korean on the left, Arabic on the right (dialogue, example tables)

## Full book

`python3 full.py` builds `out/book-1.pdf`: cover (`assets/cover.pdf`, page 1 of the old book), contents,
units 1-24 with whole-book page numbers, answer key (`answers_key.json`, parsed from the old key; reading answers
come from the unit JSON), end page and copyright page. Status: all 24 units authored. Still open: teacher review of the
Korean, conversation scene images, audio for the remaining pages.
