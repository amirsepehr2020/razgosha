from pathlib import Path

path = Path("src/index.js")
source = path.read_text(encoding="utf-8")

IMPORT = 'import { buildAccountControls } from "./account-controls.js";\n'
if IMPORT not in source:
    marker = 'import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";\n'
    if marker not in source:
        raise SystemExit("account-controls: score import marker not found")
    source = source.replace(marker, marker + IMPORT, 1)

# Account management belongs inside the profile screen, not the main menu.
MENU_MARKER = '    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],\n    [{ text: "⚙️ حساب کارآگاهی" }, { text: "ℹ️ راهنما" }]'
MENU_REPLACEMENT = '    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],\n    [{ text: "ℹ️ راهنما" }]'
if MENU_MARKER in source:
    source = source.replace(MENU_MARKER, MENU_REPLACEMENT, 1)

FUNCTION_MARKER = 'async function profile(env, chatId, player) {'
if 'async function accountSettings(env, chatId, player)' not in source:
    functions = '''async function resetAccount(env, chatId, player) {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM player_progress WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM case_rewards WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_achievements WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_inventory WHERE player_id=?").bind(player.id),
    env.DB.prepare("UPDATE players SET score=0, level=1, streak=0, last_daily_claim=NULL, clues_viewed=0, puzzles_solved=0, perfect_streak=0, account_status='active', updated_at=? WHERE id=?").bind(now, player.id)
  ]);
  logEvent("account_reset", { player_id: player.id, telegram_id: String(player.telegram_id) });
  return sendMenu(env, chatId, "🔄 اکانتت ری‌استارت شد!\n\nهمه‌چی از صفر شروع شد؛ خود حساب و هویتت سر جاشه.\n\nحالا بیا ببینیم این بار چند پرونده رو می‌ترکونی 😎🔥", "🔄");
}

async function deleteAccount(env, chatId, player) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM player_progress WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM case_rewards WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_achievements WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM player_inventory WHERE player_id=?").bind(player.id),
    env.DB.prepare("DELETE FROM players WHERE id=?").bind(player.id)
  ]);
  logEvent("account_deleted", { player_id: player.id, telegram_id: String(player.telegram_id) });
  return sendMessage(env, chatId, "🗑️ حسابت پاک شد.\n\nهر وقت خواستی برگردی، فقط /start رو بزن و از اول شروع کن. 👋", removeKeyboard(), 450, "🗑️");
}

async function accountSettings(env, chatId, player) {
  const controls = buildAccountControls();
  return sendMessage(env, chatId, `⚙️ حساب کارآگاهی\n\n👤 ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 ${player.score || 0} امتیاز\n⭐ سطح ${player.level || 1}\n\nاز اینجا می‌تونی حسابت رو ری‌استارت کنی یا برای همیشه حذفش کنی.`, keyboard([
    [controls.reset.button],
    [controls.delete.button],
    [BACK]
  ], "مدیریت حساب..."), 550, "⚙️");
}

async function confirmAccountAction(env, chatId, player, action) {
  const controls = buildAccountControls();
  const item = controls[action];
  const confirm = action === "reset" ? "✅ بله، ری‌استارت کن" : "🗑️ بله، حذفش کن";
  const cancel = "❌ نه، بی‌خیال";
  return sendMessage(env, chatId, `${item.confirmation}\n\nاگر مطمئنی، دکمه تأیید رو بزن.`, keyboard([[confirm], [cancel, BACK]], "تأیید عملیات..."), 500, "⚠️");
}

'''
    if FUNCTION_MARKER not in source:
        raise SystemExit("account-controls: profile marker not found")
    # Rename the existing profile implementation and put a new profile screen in front of it.
    source = source.replace(FUNCTION_MARKER, 'async function legacyProfile(env, chatId, player) {', 1)
    profile_wrapper = '''async function profile(env, chatId, player) {
  const solved = await env.DB.prepare("SELECT COUNT(*) AS count FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).first();
  const solvedCount = Number(solved?.count || 0);
  const controls = buildAccountControls();
  return sendMessage(env, chatId, `👤 پروفایل کارآگاهی\n\n🕵️ ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 امتیاز: ${player.score || 0}\n⭐ سطح: ${player.level || 1}\n🔥 استریک: ${player.streak || 0}\n📁 پرونده‌های حل‌شده: ${solvedCount}\n\n⚙️ مدیریت حساب`, keyboard([
    [controls.reset.button, controls.delete.button],
    [BACK]
  ], "پروفایل کارآگاهی...");
}

'''
    source = source.replace('async function legacyProfile(env, chatId, player) {', functions + 'async function legacyProfile(env, chatId, player) {', 1)
    # Place the new wrapper immediately after the legacy function using a marker at the next known function.
    next_marker = 'async function rank(env, chatId) {'
    if next_marker not in source:
        raise SystemExit("account-controls: rank marker not found")
    source = source.replace(next_marker, profile_wrapper + next_marker, 1)

HANDLER_MARKER = '  if (text === "/profile" || text === "👤 پروفایل") return profile(env, chatId, player);\n'
HANDLER = '''  if (text === "🔄 ری‌استارت حساب") return confirmAccountAction(env, chatId, player, "reset");
  if (text === "🗑️ حذف حساب") return confirmAccountAction(env, chatId, player, "delete");
  if (text === "❌ نه، بی‌خیال") return profile(env, chatId, player);
  if (text === "✅ بله، ری‌استارت کن") return resetAccount(env, chatId, player);
  if (text === "🗑️ بله، حذفش کن") return deleteAccount(env, chatId, player);
'''
if 'return resetAccount(env, chatId, player);' not in source:
    if HANDLER_MARKER not in source:
        raise SystemExit("account-controls: profile handler marker not found")
    source = source.replace(HANDLER_MARKER, HANDLER_MARKER + HANDLER, 1)

path.write_text(source, encoding="utf-8")
print("account-controls integrated inside profile")
