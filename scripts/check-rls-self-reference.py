#!/usr/bin/env python3
"""Fail when a migration creates an RLS policy on table T whose own
USING / WITH CHECK clause subqueries T.

Postgres re-evaluates the policy for the inner query and refuses with
"infinite recursion detected in policy for relation T" at QUERY time, not at
CREATE POLICY time, so it ships silently. Called by .github/workflows/ci.yml
once per newly added migration file.

This lived inline in ci.yml as a heredoc. The Python sat at column 0 inside a
YAML block scalar, which is not valid YAML: GitHub rejected the whole workflow
file ("workflow file issue") and NO job in ci.yml ran on any push, from the
day the step was added until 13 Nov 2026. A script file cannot break the
workflow's own syntax.

    python3 scripts/check-rls-self-reference.py supabase/migrations/<file>.sql
"""
import re, sys

path = sys.argv[1]
text = open(path, encoding="utf-8", errors="ignore").read()

pattern = re.compile(
    r'create\s+policy\s+"([^"]+)"\s*(?:\n\s*)?'
    r'on\s+(?:public\.)?(\w+)\s+for\s+\w+(?:\s+to\s+\w+)?\s*'
    r'((?:using|with\s+check)\s*\(.*?\))\s*(?=;|\n\s*(?:using|with\s+check))',
    re.IGNORECASE | re.DOTALL,
)

found = False
for m in pattern.finditer(text):
    polname, table, clause = m.group(1), m.group(2), m.group(3)
    if re.search(r'from\s+(?:public\.)?' + re.escape(table) + r'\b', clause, re.IGNORECASE):
        line_no = text[: m.start()].count("\n") + 1
        print(f"::error file={path},line={line_no}::Policy \"{polname}\" on {table} subqueries {table} from inside its own clause — this causes \"infinite recursion detected in policy for relation {table}\" at query time. Move the self-lookup into a SECURITY DEFINER helper function instead (see exchange_viewer_age(uuid) for the pattern).")
        found = True

sys.exit(1 if found else 0)
