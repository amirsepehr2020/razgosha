from pathlib import Path

p = Path("src/cases.js")
s = p.read_text(encoding="utf-8")

# Keep the ten legacy cases and append the 50 authored advanced cases exactly once.
if 'import { ADVANCED_CASES } from "./advanced-cases.js";' not in s:
    s = 'import { ADVANCED_CASES } from "./advanced-cases.js";\n\n' + s

if "...ADVANCED_CASES" not in s:
    marker = "\n];"
    if marker not in s:
        raise SystemExit("Could not find CASES array terminator")
    s = s.rsplit(marker, 1)[0] + "\n  ...ADVANCED_CASES" + marker

p.write_text(s, encoding="utf-8")
