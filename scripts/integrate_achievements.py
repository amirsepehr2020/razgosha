from pathlib import Path
import re

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

old = '''const ACHIEVEMENTS = [
  ["first-case", "اولین پرونده", "اولین پرونده‌ات رو حل کن 🕵️"],
  ["three-cases", "سه‌تایی", "سه پرونده رو جمع کن 🔥"],
  ["five-cases", "کارآگاه حرفه‌ای", "پنج پرونده رو حل کن 🧠"],
  ["ten-cases", "افسانه رازگشا", "هر ۶۰ پرونده رو حل کن 👑"]
];'''
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
if old in s:
    s = s.replace(old, new, 1)
elif '"perfect-streak"' not in s:
    raise SystemExit("achievement block not found")

help_pattern = r'  achievements: `🏅 دستاوردها\\n\\n.*?`,\n  items:'
help_replacement = '''  achievements: `🏅 دستاوردها\\n\\nدستاوردها مسیر پیشرفت کارآگاهیت رو می‌سازن.\\n\\n🟢 شروع: اولین پرونده، ۳ پرونده، ۵ پرونده\\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\\n🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده\\n🔴 مخفی: چشم عقاب، ردیاب زمان، دست پشت پرده و غیرممکن؟\\n\\n🔒 بعضی نشان‌ها شرایط مخفی دارن؛ باید خودت کشفشون کنی.\\n\\nهر نشان یعنی یک قدم نزدیک‌تر به استاد کارآگاهی شدن. 👑`,
  items:'''
s, count = re.subn(help_pattern, help_replacement, s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("achievement help text not found")

old_unlock = '''      if (solved >= 10) wanted.push("ten-cases");
      if (solved >= 20) wanted.push("twenty-cases");
      if (solved >= 30) wanted.push("thirty-cases");
      if (solved >= 50) wanted.push("fifty-cases");
      if (solved >= 60) wanted.push("sixty-cases");'''
new_unlock = '''      if (solved >= 10) wanted.push("ten-cases");
      if (solved >= 20) wanted.push("twenty-cases");
      if (solved >= 30) wanted.push("thirty-cases");
      if (solved >= 50) wanted.push("fifty-cases");
      if (solved >= 60) wanted.push("sixty-cases");
      if (solved >= 1) wanted.push("clue-tracker");
      if (solved >= 5) wanted.push("puzzle-solver");'''
if old_unlock in s:
    s = s.replace(old_unlock, new_unlock, 1)

path.write_text(s, encoding="utf-8")
print("achievement system integrated")
