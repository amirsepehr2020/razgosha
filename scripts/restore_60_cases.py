from pathlib import Path

p = Path("src/cases.js")
s = p.read_text(encoding="utf-8")
if 'from "./advanced-cases.js"' not in s:
    s = 'import { ADVANCED_CASES } from "./advanced-cases.js";\n\n' + s
if 'CASES.push(...ADVANCED_CASES)' not in s:
    s = s.rstrip() + '\n\nCASES.push(...ADVANCED_CASES);\n'
p.write_text(s, encoding="utf-8")
