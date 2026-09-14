from pathlib import Path
import re

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

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
  ["eagle-eye", "👁️ چشم عقاب", "یک پرونده سخت با سرنخ کلیدی رو حل کن"],
  ["time-tracker", "🕰️ ردیاب زمان", "یک پرونده مبتنی بر خط زمانی رو حل کن"],
  ["mastermind", "🎭 دست پشت پرده", "یک پرونده سخت رو حل کن"],
  ["impossible", "🧨 غیرممکن؟", "یک پرونده ویژه رو حل کن"]
];'''
s = s[:start] + new + s[end + 2:]

help_new = '''  achievements: `🏅 دستاوردها\\n\\nمسیر کارآگاهیت اینجاست.\\n\\n🟢 شروع: اولین پرونده، ۳ پرونده، ۵ پرونده\\n🔵 پیشرفت: ۱۰، ۲۰ و ۳۰ پرونده\\n🟣 حرفه‌ای: ۵۰ و ۶۰ پرونده\\n🔴 مخفی: چشم عقاب، ردیاب زمان، دست پشت پرده و غیرممکن؟\\n\\n📊 پیشرفتت برای نشان‌های قابل‌نمایش کنار هر مورد دیده می‌شه.\\n🔒 نشان‌های مخفی تا قبل از کشف، راز می‌مونن.\\n\\n🎁 بعضی دستاوردها جایزه هم دارن. 👑`,'''
s, count = re.subn(r'  achievements: `.*?`,\n  items:', lambda _m: help_new + "\n  items:", s, count=1, flags=re.S)
if count != 1:
    raise SystemExit("achievement help block not found")

s = s.replace(
    'if (currentPage > 1) nav.push("◀️ صفحه قبل");\n  if (currentPage < totalPages) nav.push("صفحه بعد ▶️");',
    'if (currentPage > 1) nav.push(`◀️ صفحه ${currentPage - 1}`);\n  if (currentPage < totalPages) nav.push(`صفحه ${currentPage + 1} ▶️`);'
)
s, _ = re.subn(
    r'  if \(text === "◀️ صفحه قبل" \|\| text === "صفحه بعد ▶️"\) return showCases\(env, chatId, player, text === "◀️ صفحه قبل" \? 1 : 2\);',
    lambda _m: '  const pageNav = text.match(/^(?:◀️ صفحه (\\d+)|صفحه (\\d+) ▶️)$/);\n  if (pageNav) return showCases(env, chatId, player, Number(pageNav[1] || pageNav[2]));',
    s, count=1
)

start = s.find("async function unlockAchievements(env, playerId)")
end = s.find("\nfunction caseFromButton", start)
if start == -1 or end == -1:
    raise SystemExit("achievement unlocker not found")
unlocker = '''async function unlockAchievements(env, playerId, chatId = null) {
  const player = await env.DB.prepare("SELECT clues_viewed, puzzles_solved, perfect_streak FROM players WHERE id=?").bind(playerId).first();
  const solvedRows = await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(playerId).all();
  const solvedIds = new Set(solvedRows.results.map(r => r.case_id));
  const solved = solvedIds.size;
  const clueCount = Number(player?.clues_viewed || 0);
  const puzzleCount = Number(player?.puzzles_solved || 0);
  const perfectStreak = Number(player?.perfect_streak || 0);
  const solvedCases = CASES.filter(c => solvedIds.has(c.id));
  const wanted = [];
  if (solved >= 1) wanted.push("first-case");
  if (clueCount >= 10) wanted.push("clue-tracker");
  if (solved >= 3) wanted.push("three-cases");
  if (puzzleCount >= 5) wanted.push("puzzle-solver");
  if (solved >= 5) wanted.push("five-cases");
  if (solved >= 10) wanted.push("ten-cases");
  if (solved >= 20) wanted.push("twenty-cases");
  if (solved >= 30) wanted.push("thirty-cases");
  if (solved >= 50) wanted.push("fifty-cases");
  if (solved >= 60) wanted.push("sixty-cases");
  if (perfectStreak >= 5) wanted.push("perfect-streak");
  if (solvedCases.some(c => c.difficulty === "سخت" && c.clues?.some(x => /کلیدی|مهم|اثرگذار/.test(x)))) wanted.push("eagle-eye");
  if (solvedCases.some(c => /زمان|ساعت|دقیقه|تاریخ|timeline|خط زمانی/i.test(`${c.title} ${c.intro} ${(c.clues || []).join(" ")}`))) wanted.push("time-tracker");
  if (solvedCases.some(c => c.difficulty === "سخت" || c.difficulty === "خیلی سخت")) wanted.push("mastermind");
  if (solvedCases.some(c => c.difficulty === "ویژه")) wanted.push("impossible");
  const rewards = { "first-case": 10, "three-cases": 15, "five-cases": 20, "ten-cases": 30, "twenty-cases": 40, "thirty-cases": 50, "fifty-cases": 75, "sixty-cases": 100, "clue-tracker": 15, "puzzle-solver": 20, "perfect-streak": 50, "eagle-eye": 25, "time-tracker": 25, "mastermind": 35, "impossible": 50 };
  const unlocked = [];
  for (const id of wanted) {
    const result = await env.DB.prepare("INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").bind(playerId, id, new Date().toISOString()).run();
    if (Number(result?.meta?.changes || 0) > 0) unlocked.push(id);
  }
  for (const id of unlocked) {
    const reward = rewards[id] || 0;
    if (reward) await env.DB.prepare("UPDATE players SET score=score+?, updated_at=? WHERE id=?").bind(reward, new Date().toISOString(), playerId).run();
  }
  if (chatId && unlocked.length) {
    const lines = unlocked.map(id => { const a = ACHIEVEMENTS.find(x => x[0] === id); return `🏅 ${a?.[1] || id}\\n🎁 +${rewards[id] || 0} امتیاز`; }).join("\\n\\n");
    await sendMessage(env, chatId, `🎉 دستاورد جدید باز شد!\\n\\n${lines}\\n\\nادامه بده کارآگاه؛ نشان بعدی همین دوروبره 👀`, MENU, 700, "🏅");
  }
  return unlocked;
}'''
s = s[:start] + unlocker + s[end:]

start = s.find("async function achievements(env, chatId, player)")
end = s.find("\nasync function inventory", start)
if start == -1 or end == -1:
    raise SystemExit("achievement view not found")
viewer = '''async function achievements(env, chatId, player) {
  const [rows, stats] = await Promise.all([
    env.DB.prepare("SELECT achievement_id FROM player_achievements WHERE player_id = ?").bind(player.id).all(),
    env.DB.prepare("SELECT SUM(solved) AS solved, MAX(clues_viewed) AS clues_viewed, MAX(puzzles_solved) AS puzzles_solved, MAX(perfect_streak) AS perfect_streak FROM players LEFT JOIN player_progress ON player_progress.player_id=players.id WHERE players.id=?").bind(player.id).first()
  ]);
  const unlocked = new Set(rows.results.map(r => r.achievement_id));
  const solved = Number(stats?.solved || 0);
  const clues = Number(stats?.clues_viewed || 0);
  const puzzles = Number(stats?.puzzles_solved || 0);
  const streak = Number(stats?.perfect_streak || 0);
  const progress = {
    "first-case": [solved, 1], "clue-tracker": [clues, 10], "three-cases": [solved, 3], "puzzle-solver": [puzzles, 5],
    "five-cases": [solved, 5], "ten-cases": [solved, 10], "twenty-cases": [solved, 20], "thirty-cases": [solved, 30],
    "fifty-cases": [solved, 50], "sixty-cases": [solved, 60], "perfect-streak": [streak, 5]
  };
  const hidden = new Set(["eagle-eye", "time-tracker", "mastermind", "impossible"]);
  const text = ACHIEVEMENTS.map(a => {
    if (hidden.has(a[0]) && !unlocked.has(a[0])) return `🔒 دستاورد مخفی — هنوز کشف نشده`;
    const p = progress[a[0]];
    const suffix = p ? ` — ${Math.min(p[0], p[1])}/${p[1]}` : " — کشف‌شده";
    return `${unlocked.has(a[0]) ? "🏅" : "🔒"} ${a[1]}${suffix}`;
  }).join("\\n");
  return sendMessage(env, chatId, `🏅 دستاوردها\\n\\n📊 ${unlocked.size}/${ACHIEVEMENTS.length} نشان باز شده\\n\\n${text}\\n\\n🎁 بعضی نشان‌ها امتیاز جایزه دارن.\\n🔒 نشان‌های مخفی رو باید خودت کشف کنی.`, MENU, 700, "🏅");
}'''
s = s[:start] + viewer + s[end:]

# Track clue reads.
s = s.replace(needle := 'if (clueIndex >= 0 && stageClues[clueIndex]) {', needle + '\n      await env.DB.prepare("UPDATE players SET clues_viewed=clues_viewed+1, updated_at=? WHERE id=?").bind(new Date().toISOString(), player.id).run();', 1)

# Reset perfect streak on wrong answers without altering control-flow shape.
old = 'if (index !== finalCase.answer) return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.'
new_wrong = 'if (index !== finalCase.answer) {\n          await env.DB.prepare("UPDATE players SET perfect_streak=0, updated_at=? WHERE id=?").bind(new Date().toISOString(), player.id).run();\n          return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.'
s = s.replace(old, new_wrong, 1)
# The original return ends immediately before the try block; close the new branch there.
s = s.replace('puzzleKeyboard(finalCase), 850, "🤔");\n          try {', 'puzzleKeyboard(finalCase), 850, "🤔");\n        }\n          try {', 1)

# Count solved puzzles and correct streak, then evaluate achievements.
s = s.replace(
    'await unlockAchievements(env, player.id);',
    'await env.DB.prepare("UPDATE players SET puzzles_solved=puzzles_solved+1, perfect_streak=perfect_streak+1, updated_at=? WHERE id=?").bind(new Date().toISOString(), player.id).run();\n            await unlockAchievements(env, player.id, chatId);',
    1
)

path.write_text(s, encoding="utf-8")
print("complete achievement system integrated")
