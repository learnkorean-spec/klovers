const fs = require('fs');

const files = [
  'supabase/migrations/20260311120000_daily_routine_vocab_lessons_11_20.sql',
  'supabase/migrations/20260311130000_daily_routine_vocab_lessons_1_2_expanded.sql',
  'supabase/migrations/20260311140000_daily_routine_vocab_lessons_3_10_expanded.sql',
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');

  // Fix uuid declarations to integer in DECLARE blocks
  c = c.replace(/(\s+\w+_id\s+)uuid;/g, '$1integer;');

  // Fix escaped apostrophes: \' -> '' (PostgreSQL style)
  // Use a literal backslash + apostrophe search
  const backslashApostrophe = String.fromCharCode(92) + String.fromCharCode(39);
  c = c.split(backslashApostrophe).join("''");

  fs.writeFileSync(f, c, 'utf8');
  console.log('Fixed:', f);
});
