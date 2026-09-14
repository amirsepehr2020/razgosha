from pathlib import Path
import re

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

# Replace the achievement catalog deterministically and safely.
start = s.find("const ACHIEVEMENTS = [")
end = s.find("];", start)
if start == -1 or end == -1:
    raise SystemExit("achievement block not found")

new = '''const ACHIEVEMENTS = [
  ["first-case", "🕵️ کارآگاه تازه‌کار", "اولین پرونده‌ات رو حل کن"],
  ["clue-tracker", "🔎 ردیاب سرنخ", "۱۰ سرنخ رو بررسی کن"],
  ["three-cases", "🔥 سه‌تایی", "۳ پرونده رو حل کن"],
  ["puzzle-solver", "🧩 حل‌کننده معما", "۵ معما رو حل کن"],
  ["five-cases", "🧠 کارآگاه حرفه‌ای", "۵ پرونده رو حل کن"],
  ["ten-cases", "📚 پرونده‌خوان", "۱۰ پرونده رو حل کن"],
  ["twenty-cases", "🎯 کارآگاه جدی", "۲۰ پرونده رو حل کن"],
  ["thirty-cases", "🧠 ذهن تحلیلگر", "۳۰ پرونده رو حل کن"],
  ["fifty-cases", "🔥 شکارچی راز", "۵۰ پرونده رو حل کن"],
  ["sixty-cases", "👑 استاد کارآگاهی", "هر ۶۰ پرونده رو حل کن"],
  ["perfect-streak", "⚡ بدون اشتباه", "۵ پرونده رو پشت‌سرهم بدون پاسخ اشتباه حل کن"],
  ["eagle-eye", "👁️ چشم عقاب", "یک سرنخ کلیدی ویژه رو کشف کن"],
  ["time-tracker", "🕰️ ردیاب زمان", "یک پرونده مبتنی بر خط زمانی رو حل کن"],
  ["mastermind", "🎭 دست پشت پرده", "یک پرونده سخت رو حل کن"],
  ["impossible", "🧨 غیرممکن؟", "یک پرونده ویژه رو حل کن"]
];'''
s = s[:start] + new + s[end + 2:]

help_new = '''  achievements: `🏅 دستاوردها\\n\\nدستاوردها مسیر پیشرفت کارآگاهیت رو می‌سازن.\\n\\n🟢 شروع: اولین پرونده، ۳ پرونده، ۵ پرونده\\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\\n🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده\\n🔴 مخفی: چشم عقاب، ردیاب زمان، دست پشت پرده و غیرممکن؟\\n\\n🔒 بعضی نشان‌ها شرایط مخفی دارن؛ باید خودت کشفشون کنی.\\n\\nهر نشان یعنی یک قدم نزدیک‌تر به استاد کارآگاهی شدن. 👑`,'''
help_pattern = r'  achievements: `.*?`,\n  items:'
s, count = re.subn(help_pattern, lambda _m: help_new + "\n  items:", s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("achievement help block not found")

# Multi-page reply-keyboard navigation must preserve its target page.
s = s.replace(
    'if (currentPage > 1) nav.push("◀️ صفحه قبل");\n  if (currentPage < totalPages) nav.push("صفحه بعد ▶️");',
    'if (currentPage > 1) nav.push(`◀️ صفحه ${currentPage - 1}`);\n  if (currentPage < totalPages) nav.push(`صفحه ${currentPage + 1} ▶️`);'
)

page_pattern = r'  if \(text === "◀️ صفحه قبل" \|\| text === "صفحه بعد ▶️"\) return showCases\(env, chatId, player, text === "◀️ صفحه قبل" \? 1 : 2\);'
page_replacement = '  const pageNav = text.match(/^(?:◀️ صفحه (\\d+)|صفحه (\\d+) ▶️)$/);\n  if (pageNav) return showCases(env, chatId, player, Number(pageNav[1] || pageNav[2]));'
s, count = re.subn(page_pattern, lambda _m: page_replacement, s, count=1)

path.write_text(s, encoding="utf-8")
print("achievement integration complete")
