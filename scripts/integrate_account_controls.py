from pathlib import Path

path = Path("src/index.js")
source = path.read_text(encoding="utf-8")

IMPORT = 'import { buildAccountControls } from "./account-controls.js";\n'
if IMPORT not in source:
    marker = 'import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";\n'
    if marker not in source:
        raise SystemExit("account-controls: score import marker not found")
    source = source.replace(marker, marker + IMPORT, 1)

MENU_MARKER = '    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],\n    [{ text: "ℹ️ راهنما" }]'
MENU_REPLACEMENT = '    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],\n    [{ text: "⚙️ حساب کارآگاهی" }, { text: "ℹ️ راهنما" }]'
if '⚙️ حساب کارآگاهی' not in source:
    if MENU_MARKER not in source:
        raise SystemExit("account-controls: menu marker not found")
    source = source.replace(MENU_MARKER, MENU_REPLACEMENT, 1)

FUNCTION_MARKER = 'async function profile(env, chatId, player) {'
if 'async function accountSettings(env, chatId, player)' not in source:
    functions = '''async function resetAccount(env, chatId, player) {
  const now = new Date().toISOString();
  const controls = buildAccountControls();
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
  return sendMessage(env, chatId, `⚙️ حساب کارآگاهی\n\n👤 ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 ${player.score} امتیاز\n⭐ سطح ${player.level}\n\nاز اینجا می‌تونی حسابت رو ری‌استارت کنی یا برای همیشه حذفش کنی.`, keyboard([
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
    source = source.replace(FUNCTION_MARKER, functions + FUNCTION_MARKER, 1)

HANDLER_MARKER = '  if (text === "/profile" || text === "👤 پروفایل") return profile(env, chatId, player);\n'
HANDLER = '''  if (text === "⚙️ حساب کارآگاهی") return accountSettings(env, chatId, player);
  if (text === "🔄 ری‌استارت حساب") return confirmAccountAction(env, chatId, player, "reset");
  if (text === "🗑️ حذف حساب") return confirmAccountAction(env, chatId, player, "delete");
  if (text === "❌ نه، بی‌خیال") return accountSettings(env, chatId, player);
  if (text === "✅ بله، ری‌استارت کن") return resetAccount(env, chatId, player);
  if (text === "🗑️ بله، حذفش کن") return deleteAccount(env, chatId, player);
'''
if 'return resetAccount(env, chatId, player);' not in source:
    if HANDLER_MARKER not in source:
        raise SystemExit("account-controls: profile handler marker not found")
    source = source.replace(HANDLER_MARKER, HANDLER_MARKER + HANDLER, 1)

path.write_text(source, encoding="utf-8")
print("account-controls integrated")
