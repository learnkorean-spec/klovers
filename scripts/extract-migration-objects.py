#!/usr/bin/env python3
"""Extract candidate object names a migration file DEFINES, for the daily
schema-drift check (.github/workflows/schema-drift-check.yml).

This is a heuristic, not a parser: it regex-matches the three DDL shapes
that actually caused the 20260829153926 incident (a function redefinition
and two new columns applied outside this repo's own workflow, found
unrecorded days later). It will miss DROP, ALTER COLUMN TYPE, RLS policy
changes, and anything not shaped like these three - the goal is a cheap,
low-noise signal for the common case, not a complete schema differ.

Output, one per line, tab-separated: `<kind>\t<name>` where kind is one of
function / table / column:table.column. A caller feeds each name to a
targeted existence check against the live database.
"""
import argparse
import re
import sys

FUNCTION_RE = re.compile(
    r"(?is)\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z_][\w.]*)"
)
TABLE_RE = re.compile(
    r"(?is)\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_][\w.]*)"
)
# Captures one ALTER TABLE ... ADD COLUMN [IF NOT EXISTS] <col> block. Only
# handles the single-column-per-clause style this repo's migrations use
# (each ADD COLUMN repeated, comma-separated across lines) - matches each
# ADD COLUMN clause independently rather than trying to parse the whole
# statement, since the table name is what's shared across clauses.
ALTER_TABLE_RE = re.compile(r"(?is)\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z_][\w.]*)")
ADD_COLUMN_RE = re.compile(
    r"(?is)\bADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_]\w*)"
)


def bare_name(qualified: str) -> str:
    """Strip a schema prefix ('public.foo' -> 'foo') - pg_proc/information_schema
    checks below match on bare name plus schema, and public is the only
    schema this repo's migrations write application objects into."""
    return qualified.split(".")[-1]


def strip_comments(sql: str) -> str:
    """Strip -- line comments and /* */ block comments before matching -
    otherwise prose in a migration's own header (this file's included
    plenty, e.g. "CREATE FUNCTION doesn't just change...") matches the DDL
    patterns below as if it were real SQL. Naive but sufficient here: this
    repo's migrations don't put -- or /* */ inside string literals in the
    DDL shapes this script looks for."""
    sql = re.sub(r"--[^\n]*", "", sql)
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    return sql


def extract(sql: str):
    sql = strip_comments(sql)
    found = []
    for m in FUNCTION_RE.finditer(sql):
        found.append(("function", bare_name(m.group(1))))
    for m in TABLE_RE.finditer(sql):
        found.append(("table", bare_name(m.group(1))))

    # For each ALTER TABLE statement (delimited by the next semicolon or the
    # next ALTER TABLE / CREATE, whichever comes first), pair its table name
    # with every ADD COLUMN clause inside that same statement.
    for m in ALTER_TABLE_RE.finditer(sql):
        table = bare_name(m.group(1))
        stmt_start = m.end()
        stmt_end = sql.find(";", stmt_start)
        if stmt_end == -1:
            stmt_end = len(sql)
        stmt_body = sql[stmt_start:stmt_end]
        for col_m in ADD_COLUMN_RE.finditer(stmt_body):
            found.append(("column", f"{table}.{col_m.group(1)}"))

    # De-duplicate, keep order stable.
    seen = set()
    unique = []
    for kind, name in found:
        key = (kind, name)
        if key not in seen:
            seen.add(key)
            unique.append((kind, name))
    return unique


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path", help="migration .sql file to scan")
    args = ap.parse_args()

    with open(args.path, encoding="utf-8", errors="replace") as fh:
        sql = fh.read()

    for kind, name in extract(sql):
        print(f"{kind}\t{name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
