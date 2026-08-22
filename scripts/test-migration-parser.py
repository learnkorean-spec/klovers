#!/usr/bin/env python3
"""Check parse-migration-list.py against output captured from a real run.

The fixture is copied verbatim from Migration Runbook run #2, which is the
point: the previous fixture was written from memory - box-drawing characters,
bare unquoted versions - so it agreed with the parser's assumptions instead of
with the tool, and the parser shipped reporting 0 pending against real output.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARSER = ROOT / "scripts" / "parse-migration-list.py"
FIXTURES = ROOT / ".github" / "fixtures"

failures: list[str] = []


def check(label: str, actual, expected) -> None:
    if actual == expected:
        print(f"  ok    {label}: {actual}")
    else:
        print(f"  FAIL  {label}: expected {expected}, got {actual}")
        failures.append(label)


def run(fixture: str, *extra: str):
    return subprocess.run(
        [sys.executable, str(PARSER), str(FIXTURES / fixture), *extra],
        capture_output=True,
        text=True,
    )


print("real captured output:")
result = run("migration-list.txt")
fields = dict(
    line.split("=", 1) for line in result.stdout.splitlines() if "=" in line and not line.startswith("pending=")
)
pending = [line.split("=", 1)[1] for line in result.stdout.splitlines() if line.startswith("pending=")]
check("exit code", result.returncode, 0)
check("pending_count", fields.get("pending_count"), "3")
check(
    "pending versions",
    pending,
    ["20260422120000", "20260423000000", "20260522000000"],
)
check("applied_both_sides", fields.get("applied_both_sides"), "6")
check("remote_only", fields.get("remote_only"), "3")

print("remote-only rows are not counted as pending:")
check("remote_only rows present", int(fields.get("remote_only", 0)) > 0, True)

print("unparseable output is refused rather than reported as zero:")
bad = run("migration-list-unparseable.txt")
check("exit code", bad.returncode, 2)
check("says nothing was recognised", "no rows recognised" in bad.stderr, True)

print("a short parse is refused when local migrations are missing from it:")
short = run("migration-list.txt", "--min-rows", "251")
check("exit code", short.returncode, 2)
check("names the shortfall", "local migrations" in short.stderr, True)

if failures:
    print(f"\n{len(failures)} check(s) failed: {', '.join(failures)}")
    sys.exit(1)
print("\nall parser checks passed")
