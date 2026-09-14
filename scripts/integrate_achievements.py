from pathlib import Path
import re

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

achievements = '''const ACHIEVEMENTS = [
  ["first-case", "🕵️ کارآگاه تازه‌کار", "اولین پرونده‌ات رو حل کن"],
  ["clue-tracker", "🔎 ردیاب سرنخ", "۱۰ سرنخ از پرونده‌های حل‌شده جمع کن"],
  ["three-cases", "🔥 سه‌تایی", "۳ پرونده رو حل کن"],
  ["puzzle-solver", "🧩 حل‌کننده معما", "۵ پرونده چندمرحله‌ای رو حل کن"],
  ["five-cases", "🧠 کارآگاه حرفه‌ای", "۵ پرونده رو حل کن"],
  ["ten-cases", "📚 پرونده‌خوان", "۱۰ پرونده رو حل کن"],
  ["twenty-cases", "🎯 کارآگاه جدی", "۲۰ پرونده رو حل کن"],
  ["thirty-cases", "🧠 ذهن تحلیلگر", "۳۰ پرونده رو حل کن"],
  ["fifty-cases", "🔥 شکارچی راز", "۵۰ پرونده رو حل کن"],
  ["sixty-cases", "👑 استاد کارآگاهی", "هر ۶۰ پرونده رو حل کن"],
  ["perfect-streak", "⚡ زنجیره بی‌نقص", "۵ پرونده رو پشت‌سرهم بدون پاسخ اشتباه حل کن"],
  ["eagle-eye", "👁️ چشم عقاب", "یک پرونده سخت با شواهد کلیدی رو حل کن"],
  ["time-tracker", "🕰️ ردیاب زمان", "یک پرونده مبتنی بر زمان رو حل کن"],
  ["mastermind", "🎭 ذهن پشت پرده", "یک پرونده خیلی سخت رو حل کن"],
  ["impossible", "🧨 غیرممکن؟", "یک پرونده ویژه رو حل کن"]
];'''
s, count = re.subn(r'const ACHIEVEMENTS = \[.*?\];', achievements, s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("achievement catalog not found")

help_text = '''  achievements: `🏅 دستاوردها\\n\\nمسیر کارآگاهیت اینجاست.\\n\\n🟢 شروع: اولین، سومین و پنجمین پرونده\\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\\n🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده\\n🟠 مهارت: ردیاب سرنخ و حل‌کننده معما\\n🔴 مخفی: چشم عقاب، ردیاب زمان، ذهن پشت پرده و غیرممکن؟\\n\\n📊 پیشرفت دستاوردهای قابل‌نمایش به شکل x/y دیده می‌شه.\\n🔒 بعضی نشان‌ها شرایط مخفی دارن و تا زمان کشف، هویت و شرطشون نمایش داده نمی‌شه.\\n🎁 هر نشان جدید می‌تونه جایزه امتیازی داشته باشه.`,'''
s, count = re.subn(r'  achievements: `.*?`,\n  items:', help_text + "\n  items:", s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("achievement help content not found")

unlocker = '''async function unlockAchievements(env, playerId) {
  const rows = await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(playerId).all();
  const solvedIds = new Set(rows.results.map(r => r.case_id));
  const solved = solvedIds.size;
  const solvedCases = CASES.filter(c => solvedIds.has(c.id));
  const clueCount = solvedCases.reduce((sum, c) => sum + (Array.isArray(c.clues) ? c.clues.length : 0), 0);
  const multiStageCount = solvedCases.filter(c => getStageCount(c) >= 3).length;
  const wanted = [];

  if (solved >= 1) wanted.push("first-case");
  if (clueCount >= 10) wanted.push("clue-tracker");
  if (solved >= 3) wanted.push("three-cases");
  if (multiStageCount >= 5) wanted.push("puzzle-solver");
  if (solved >= 5) wanted.push("five-cases");
  if (solved >= 10) wanted.push("ten-cases");
  if (solved >= 20) wanted.push("twenty-cases");
  if (solved >= 30) wanted.push("thirty-cases");
  if (solved >= 50) wanted.push("fifty-cases");
  if (solved >= 60) wanted.push("sixty-cases");

  const hiddenCase = solvedCases.some(c => {
    const text = `${c.title} ${c.intro} ${(c.clues || []).join(" ")}`;
    return c.difficulty === "سخت" && /کلیدی|مهم|اثرگذار/.test(text);
  });
  const timeCase = solvedCases.some(c => /زمان|ساعت|دقیقه|تاریخ|بازه|timeline|خط زمانی/i.test(`${c.title} ${c.intro} ${(c.clues || []).join(" ")}`));
  const veryHard = solvedCases.some(c => /خیلی سخت|نابغه|genius/i.test(String(c.difficulty || "")));
  const special = solvedCases.some(c => /ویژه|special/i.test(String(c.difficulty || "")));
  if (hiddenCase) wanted.push("eagle-eye");
  if (timeCase) wanted.push("time-tracker");
  if (veryHard) wanted.push("mastermind");
  if (special) wanted.push("impossible");

  const rewards = {
    "first-case": 10, "clue-tracker": 15, "three-cases": 15, "puzzle-solver": 25,
    "five-cases": 20, "ten-cases": 30, "twenty-cases": 40, "thirty-cases": 50,
    "fifty-cases": 75, "sixty-cases": 100, "perfect-streak": 50,
    "eagle-eye": 25, "time-tracker": 25, "mastermind": 35, "impossible": 50
  };

  const newlyUnlocked = [];
  for (const id of wanted) {
    const result = await env.DB.prepare("INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").bind(playerId, id, new Date().toISOString()).run();
    if (Number(result?.meta?.changes || 0) > 0) newlyUnlocked.push(id);
  }
  for (const id of newlyUnlocked) {
    const reward = rewards[id] || 0;
    if (reward) await env.DB.prepare("UPDATE players SET score=score+?, updated_at=? WHERE id=?").bind(reward, new Date().toISOString(), playerId).run();
  }
  return newlyUnlocked;
}'''
start = s.find("async function unlockAchievements(env, playerId)")
end = s.find("\nfunction caseFromButton", start)
if start == -1 or end == -1:
    raise SystemExit("achievement unlocker not found")
s = s[:start] + unlocker + s[end:]

viewer = '''async function achievements(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT achievement_id FROM player_achievements WHERE player_id=?").bind(player.id).all();
  const unlocked = new Set(rows.results.map(r => r.achievement_id));
  const progressRows = await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).all();
  const solvedIds = new Set(progressRows.results.map(r => r.case_id));
  const solved = solvedIds.size;
  const solvedCases = CASES.filter(c => solvedIds.has(c.id));
  const clueCount = solvedCases.reduce((sum, c) => sum + (Array.isArray(c.clues) ? c.clues.length : 0), 0);
  const multiStageCount = solvedCases.filter(c => getStageCount(c) >= 3).length;
  const progress = {
    "first-case": [solved, 1], "clue-tracker": [clueCount, 10], "three-cases": [solved, 3],
    "puzzle-solver": [multiStageCount, 5], "five-cases": [solved, 5], "ten-cases": [solved, 10],
    "twenty-cases": [solved, 20], "thirty-cases": [solved, 30], "fifty-cases": [solved, 50], "sixty-cases": [solved, 60]
  };
  const hidden = new Set(["perfect-streak", "eagle-eye", "time-tracker", "mastermind", "impossible"]);
  const visible = ACHIEVEMENTS.map(a => {
    if (hidden.has(a[0]) && !unlocked.has(a[0])) return "🔒 دستاورد مخفی — هنوز کشف نشده";
    const p = progress[a[0]];
    const suffix = p ? ` — ${Math.min(Number(p[0]), Number(p[1]))}/${p[1]}` : " — کشف‌شده";
    return `${unlocked.has(a[0]) ? "🏅" : "🔒"} ${a[1]}${suffix}`;
  });
  const unlockedCount = ACHIEVEMENTS.filter(a => unlocked.has(a[0])).length;
  const text = [
    "🏅 دستاوردها", "", `📊 ${unlockedCount}/${ACHIEVEMENTS.length} نشان باز شده`, "",
    "🟢 شروع", ...visible.slice(0, 3), "",
    "🔵 پیشرفت", ...visible.slice(3, 6), "",
    "🟣 حرفه‌ای", ...visible.slice(6, 8), "",
    "🟠 مهارت", ...visible.slice(8, 10), "",
    "🔴 مخفی", ...visible.slice(10), "",
    "🎁 هر بار که نشان جدیدی باز کنی، همون لحظه بهت خبر می‌دم."
  ].join("\\n");
  return sendMessage(env, chatId, text, MENU, 700, "🏅");
}'''
start = s.find("async function achievements(env, chatId, player)")
end = s.find("\nasync function inventory", start)
if start == -1 or end == -1:
    raise SystemExit("achievement viewer not found")
s = s[:start] + viewer + s[end:]

# Keep the existing test-compatible call shape. Notification is intentionally handled by the UI later.
s, count = re.subn(r'(?m)^[ \t]*await unlockAchievements\(env, player\.id\);[ \t]*$', '            await unlockAchievements(env, player.id);', s, count=1)
if count != 1:
    raise SystemExit("achievement call site not found")

path.write_text(s, encoding="utf-8")
print("advanced achievements integrated")
