#!/usr/bin/env python3
"""Report pending migrations from `supabase migration list` output.

The CLI prints a three-column table. Cells are wrapped in backticks and an
empty cell is a backticked space:

     Local            | Remote           | Time (UTC)
    ------------------|------------------|-----------------------
     `20260211175347` | `20260211175347` | `2026-02-11 17:53:47`
     ` `              | `20260421122000` | `2026-04-21 12:20:00`
     `20260422120000` | ` `              | `2026-04-22 12:00:00`

A row is pending only when LOCAL holds a version and REMOTE does not. Two
things make that harder than it looks, and both have bitten this workflow:

  * Remote-only rows - roughly a hundred versions applied by hand with no
    local file - carry a single version just as a pending row does, so
    counting versions per line reports them all as pending.
  * The values are backticked, so comparing a raw cell against ^\\d{14}$
    matches nothing at all and every row is silently skipped.

The second failure is the dangerous one: it yields `pending_count=0`, which
is indistinguishable from a genuine zero. Hence --min-rows, and the refusal
to report a count when nothing parsed.
"""
import argparse
import re
import sys

VERSION = re.compile(r"\d{14}")
SEPARATORS = re.compile(r"[│|]")


def cell(raw: str) -> str:
    """Strip padding and the backticks the CLI wraps every value in."""
    return raw.strip().strip("`").strip()


def parse(path: str):
    pending: list[str] = []
    both = 0
    remote_only = 0
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = SEPARATORS.split(line)
            if len(parts) < 3:
                continue
            local, remote = cell(parts[0]), cell(parts[1])
            local_ok = bool(VERSION.fullmatch(local))
            remote_ok = bool(VERSION.fullmatch(remote))
            if local_ok and not remote_ok:
                pending.append(local)
            elif local_ok and remote_ok:
                both += 1
            elif remote_ok:
                remote_only += 1
    return pending, both, remote_only


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path", help="file holding captured `migration list` output")
    ap.add_argument(
        "--min-rows",
        type=int,
        default=0,
        help="fail unless at least this many rows are recognised. Pass the number "
        "of local migration files: every one of them must appear in the list.",
    )
    args = ap.parse_args()

    pending, both, remote_only = parse(args.path)
    total = len(pending) + both + remote_only

    print(f"applied_both_sides={both}")
    print(f"remote_only={remote_only}")
    print(f"pending_count={len(pending)}")
    for version in pending:
        print(f"pending={version}")

    if total == 0:
        print(
            "ERROR: no rows recognised. The migration list is not in the format "
            "this parser understands, so the count above is meaningless. Refusing "
            "to report it as a real result.",
            file=sys.stderr,
        )
        return 2
    if total < args.min_rows:
        print(
            f"ERROR: recognised {total} rows but the repo holds {args.min_rows} "
            "local migrations, every one of which must appear in the list. The "
            "output format has probably changed - do not trust the count above.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
