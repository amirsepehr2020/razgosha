from pathlib import Path

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

old = '''const ACHIEVEMENTS = [\n  ["first-case", "اولین پرونده", "اولین پرونده‌ات رو حل کن 🕵️"],\n  ["three-cases", "سه‌تایی", "سه پرونده رو جمع کن 🔥"],\n  ["five-cases", "کارآگاه حرفه‌ای", "پنج پرونده رو حل کن 🧠"],\n  ["ten-cases", "افسانه رازگشا", "هر ۶۰ پرونده رو حل کن 👑"]\n];'''
new = '''const ACHIEVEMENTS = [\n  ["first-case", "🕵️ کارآگاه تازه‌کار", "اولین پرونده‌ات رو حل کن"],\n  ["clue-tracker", "🔎 ردیاب سرنخ", "۱۰ سرنخ رو بررسی کن"],\n  ["three-cases", "🔥 سه‌تایی", "۳ پرونده رو حل کن"],\n  ["puzzle-solver", "🧩 حل‌کننده معما", "۵ معما رو حل کن"],\n  ["five-cases", "🧠 کارآگاه حرفه‌ای", "۵ پرونده رو حل کن"],\n  ["ten-cases", "📚 پرونده‌خوان", "۱۰ پرونده رو حل کن"],\n  ["twenty-cases", "🎯 کارآگاه جدی", "۲۰ پرونده رو حل کن"],\n  ["thirty-cases", "🧠 ذهن تحلیلگر", "۳۰ پرونده رو حل کن"],\n  ["fifty-cases", "🔥 شکارچی راز", "۵۰ پرونده رو حل کن"],\n  ["sixty-cases", "👑 استاد کارآگاهی", "هر ۶۰ پرونده رو حل کن"],\n  ["perfect-streak", "⚡ بدون اشتباه", "۵ پرونده رو پشت‌سرهم بدون پاسخ اشتباه حل کن"],\n  ["eagle-eye", "👁️ چشم عقاب", "یک سرنخ کلیدی ویژه رو کشف کن"],\n  ["time-tracker", "🕰️ ردیاب زمان", "یک پرونده مبتنی بر خط زمانی رو حل کن"],\n  ["mastermind", "🎭 دست پشت پرده", "یک پرونده سخت رو حل کن"],\n  ["impossible", "🧨 غیرممکن؟", "یک پرونده ویژه رو حل کن"]\n];'''
if old not in s:
    raise SystemExit("achievement block not found")
s = s.replace(old, new, 1)

old_help = '''achievements: `🏅 دستاوردها\\n\\nدستاوردها برای ثبت پیشرفت‌های مهمت هستن.\\n\\n🕵️ اولین پرونده\\n🔥 حل ۳ پرونده\\n🧠 حل ۵ پرونده\\n👑 حل هر ۱۰ پرونده فعلی\\n\\nهرچی بیشتر پیش بری، نشان‌های بیشتری برای پروفایلت باز می‌شن.`,'''
new_help = '''achievements: `🏅 دستاوردها\\n\\nدستاوردها مسیر پیشرفت کارآگاهیت رو می‌سازن.\\n\\n🟢 شروع: اولین پرونده، ۳ پرونده، ۵ پرونده\\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\\n🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده\\n🔴 مخفی: چشم عقاب، ردیاب زمان، دست پشت پرده و غیرممکن؟\\n\\n🔒 بعضی نشان‌ها شرایط مخفی دارن؛ باید خودت کشفشون کنی.\\n\\nهر نشان یعنی یک قدم نزدیک‌تر به استاد کارآگاهی شدن. 👑`,'''
if old_help not in s:
    raise SystemExit("achievement help text not found")
s = s.replace(old_help, new_help, 1)

old_unlock = '''      if (solved >= 10) wanted.push("ten-cases");\n      if (solved >= 20) wanted.push("twenty-cases");\n      if (solved >= 30) wanted.push("thirty-cases");\n      if (solved >= 50) wanted.push("fifty-cases");\n      if (solved >= 60) wanted.push("sixty-cases");'''
new_unlock = '''      if (solved >= 10) wanted.push("ten-cases");\n      if (solved >= 20) wanted.push("twenty-cases");\n      if (solved >= 30) wanted.push("thirty-cases");\n      if (solved >= 50) wanted.push("fifty-cases");\n      if (solved >= 60) wanted.push("sixty-cases");\n      if (solved >= 1) wanted.push("clue-tracker");\n      if (solved >= 5) wanted.push("puzzle-solver");'''
if old_unlock not in s:
    raise SystemExit("achievement unlock block not found")
s = s.replace(old_unlock, new_unlock, 1)

path.write_text(s, encoding="utf-8")
print("achievement system integrated")
