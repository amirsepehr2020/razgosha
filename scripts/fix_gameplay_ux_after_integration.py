from pathlib import Path

p = Path("src/index.js")
s = p.read_text(encoding="utf-8")

# Make archive navigation carry its target page in the reply-keyboard label.
s = s.replace('if (currentPage > 1) nav.push("◀️ صفحه قبل");\n  if (currentPage < totalPages) nav.push("صفحه بعد ▶️");', 'if (currentPage > 1) nav.push(`◀️ صفحه ${currentPage - 1}`);\n  if (currentPage < totalPages) nav.push(`صفحه ${currentPage + 1} ▶️`);')
s = s.replace('  if (text === "◀️ صفحه قبل" || text === "صفحه بعد ▶️") return showCases(env, chatId, player, text === "◀️ صفحه قبل" ? 1 : 2);', '''  const pageNav = text.match(/^(?:◀️ صفحه (\\d+)|صفحه (\\d+) ▶️)$/);
  if (pageNav) return showCases(env, chatId, player, Number(pageNav[1] || pageNav[2]));''')

# Keep achievement definitions aligned with the progression checks.
old = '''  ["ten-cases", "افسانه رازگشا", "هر ده پرونده فعلی رو حل کن 👑"]
];'''
new = '''  ["ten-cases", "ده‌تایی", "۱۰ پرونده رو حل کن 👑"],
  ["twenty-cases", "بیست‌تایی", "۲۰ پرونده رو حل کن 🔥"],
  ["thirty-cases", "سی‌تایی", "۳۰ پرونده رو حل کن 🧠"],
  ["fifty-cases", "نابغه رازگشا", "۵۰ پرونده رو حل کن 🏆"],
  ["sixty-cases", "افسانه رازگشا", "هر ۶۰ پرونده رو حل کن 👑"]
];'''
if old in s:
    s = s.replace(old, new)

# Remove stale references to the old ten-case archive size from player-facing help.
s = s.replace("👑 حل هر ۱۰ پرونده فعلی", "👑 حل هر ۶۰ پرونده فعلی")
s = s.replace("هر ۱۰ پرونده فعلی", "هر ۶۰ پرونده فعلی")

p.write_text(s, encoding="utf-8")
