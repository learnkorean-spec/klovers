# Book 1 generator (A0 style)

`python3 build.py 05` reads `units/05.json` and writes `out/unit-05.pdf` (A5, cream #FFF9EC,
"الوحدة" instead of "الحصة", no class counts or minutes, footer "الصفحة N من M").
Needs `google-chrome` and the bundled fonts in `fonts/`. Icons come from `public/picture-library/icons`.
One JSON per unit: title, goals, vocab (icon id, Korean, Arabic), grammar, dialogue, practice.
Status: units 5-12 done (6 and 12 are review units). Units 1-4 and 13-24 still need their JSON. Korean must be reviewed. Answer-key pages and scene images are not built yet.
- always use brand yellow #FFFF00 (no other yellows)
- layout rule: Korean on the left, Arabic on the right (dialogue, example tables)
