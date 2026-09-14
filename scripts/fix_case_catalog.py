from pathlib import Path
import re

p = Path("src/cases.js")
s = p.read_text(encoding="utf-8")
s = s.replace('import { ADVANCED_CASES } from "./advanced-cases.js";\n\n', '')
s = re.sub(r'\n\s*\.\.\.ADVANCED_CASES,?', '', s)
p.write_text(s, encoding="utf-8")
