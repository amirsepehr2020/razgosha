import { createRewardToken, getSafeErrorMessage } from "./game-guards.js";
import { CASES, getCase } from "./cases.js";

const MENU = { inline_keyboard: [
  [{ text: "🔎 پرونده‌ها", callback_data: "menu:cases" }, { text: "🎯 مأموریت امروز", callback_data: "menu:daily" }],
  [{ text: "👤 پروفایل", callback_data: "menu:profile" }, { text: "🏆 رتبه‌بندی", callback_data: "menu:rank" }],
  [{ text: "🏅 دستاوردها", callback_data: "menu:achievements" }, { text: "🎒 کوله‌باز", callback_data: "menu:inventory" }],
  [{ text: "ℹ️ راهنما", callback_data: "menu:help" }]
] };

const ACHIEVEMENTS = [
  ["first-case", "اولین پرونده", "اولین پرونده‌ات رو حل کن 🕵️"],
  ["three-cases", "سه‌تایی", "سه پرونده رو جمع کن 🔥"],
  ["five-cases", "کارآگاه حرفه‌ای", "پنج پرونده رو حل کن 🧠"],
  ["ten-cases", "افسانه رازگشا", "هر ده پرونده فعلی رو حل کن 👑"]
];

const ITEMS = [["hint", "🔍 سرنخ اضافه"], ["remove", "💡 حذف یک گزینه"]];

function logEvent(event, details = {}) { console.log(JSON.stringify({ event, ...details, timestamp: new Date().toISOString() })); }

async function telegram(env, method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok || !result.ok) logEvent("telegram_error", { method, status: response.status, description: result.description || "unknown" });
    return result;
  } catch (error) { logEvent("telegram_error", { method, message: error?.message || "network_error" }); throw error; }
}

function esc(text) { return String(text).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

async function findPlayer(env, telegramId) {
  return env.DB.prepare("SELECT * FROM players WHERE telegram_id = ? AND account_status = 'active'").bind(String(telegramId)).first();
}

async function createAccount(env, from) {
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO players (telegram_id, username, first_name, detective_name, score, level, account_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, 1, 'active', ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name, account_status='active', updated_at=excluded.updated_at`)
    .bind(String(from.id), from.username || null, from.first_name || "کارآگاه", from.first_name || "کارآگاه", now, now).run();
  const player = await findPlayer(env, from.id);
  await env.DB.batch(ITEMS.map(([id]) => env.DB.prepare(`INSERT INTO player_inventory (player_id, item_id, quantity) VALUES (?, ?, 0) ON CONFLICT(player_id, item_id) DO NOTHING`).bind(player.id, id)));
  return player;
}

async function requireAccount(env, chatId, telegramId) {
  const player = await findPlayer(env, telegramId);
  if (player) return player;
  await telegram(env, "sendMessage", { chat_id: chatId, text: "🔐 اول باید حساب رازگشات رو بسازی.\n\nفقط /start رو بزن تا پروفایلت ساخته بشه؛ بعدش بزن بریم سراغ پرونده‌ها 😎" });
  return null;
}

async function sendMenu(env, chatId, text = "🕵️ برگشتی کارآگاه!\n\nخب، امروز کدوم پرونده رو می‌خوای بترکونی؟") { return telegram(env, "sendMessage", { chat_id: chatId, text, reply_markup: MENU }); }

function caseKeyboard(c) {
  return { inline_keyboard: [
    ...c.clues.map((_, i) => [{ text: `🔍 سرنخ ${i + 1}`, callback_data: `clue:${c.id}:${i}` }]),
    [{ text: "🧩 رفتن سراغ معما", callback_data: `puzzle:${c.id}` }],
    [{ text: "📁 پرونده‌های دیگر", callback_data: "menu:cases" }, { text: "🏠 منو", callback_data: "menu:home" }]
  ] };
}

async function showCases(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const progress = new Map(rows.results.map(r => [r.case_id, r.solved]));
  const lines = CASES.map((c, i) => `${progress.get(c.id) ? "✅" : i === 0 || progress.get(CASES[i - 1]?.id) ? "🟢" : "🔒"} ${c.title} — ${c.difficulty} — ${c.reward} امتیاز`).join("\n");
  const buttons = CASES.map((c, i) => [{ text: `${progress.get(c.id) ? "🔁" : i === 0 || progress.get(CASES[i - 1]?.id) ? "🔎" : "🔒"} ${c.title.split("—")[1].trim()}`, callback_data: `case:${c.id}` }]);
  return telegram(env, "sendMessage", { chat_id: chatId, text: `📁 آرشیو پرونده‌ها\n\n${lines}\n\n🔓 پرونده‌ها به‌ترتیب باز می‌شن. اولی رو بزن و شروع کنیم!`, reply_markup: { inline_keyboard: [...buttons, [{ text: "🏠 منو", callback_data: "menu:home" }]] } });
}

async function startCase(env, chatId, player, caseId) {
  const c = getCase(caseId);
  if (!c) return sendMenu(env, chatId, "این پرونده رو پیدا نکردم 😅");
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const solved = new Set(rows.results.filter(r => r.solved).map(r => r.case_id));
  const idx = CASES.findIndex(x => x.id === caseId);
  if (idx > 0 && !solved.has(CASES[idx - 1].id)) return sendMenu(env, chatId, "🔒 هنوز این پرونده برات باز نشده. اول قبلی رو حل کن، بعد میایم سراغ این یکی 😉");
  await env.DB.prepare(`INSERT INTO player_progress (player_id, case_id, current_step, solved, updated_at) VALUES (?, ?, 0, 0, ?) ON CONFLICT(player_id, case_id) DO NOTHING`).bind(player.id, c.id, new Date().toISOString()).run();
  return telegram(env, "sendMessage", { chat_id: chatId, text: `📂 ${c.title}\n\n${c.intro}\n\n👥 مظنون‌ها:\n${c.suspects.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nخب کارآگاه... سرنخ‌ها رو یکی‌یکی ببین. عجله نکن؛ یه جزئیات کوچیک ممکنه کل ماجرا رو عوض کنه 👀`, reply_markup: caseKeyboard(c) });
}

async function profile(env, chatId, player) {
  const stats = await env.DB.prepare("SELECT COUNT(*) AS total, SUM(solved) AS solved FROM player_progress WHERE player_id = ?").bind(player.id).first();
  return telegram(env, "sendMessage", { chat_id: chatId, text: `👤 پروفایل کارآگاه\n\n🪪 اسم: ${esc(player.detective_name || player.first_name || "کارآگاه")}\n🏆 امتیاز: ${player.score}\n⭐ سطح: ${player.level}\n📁 پرونده‌های حل‌شده: ${stats.solved || 0}\n🔥 استریک روزانه: ${player.streak || 0}\n\nآروم‌آروم بیا بالا؛ رتبه‌ها منتظرتن 😎`, reply_markup: { inline_keyboard: [[{ text: "🏠 منو", callback_data: "menu:home" }]] } });
}

async function rank(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT first_name, detective_name, score FROM players WHERE account_status='active' ORDER BY score DESC, id ASC LIMIT 10").all();
  const text = rows.results.map((p, i) => `${i + 1}. ${esc(p.detective_name || p.first_name || "کارآگاه")} — ${p.score} امتیاز`).join("\n") || "هنوز کسی امتیاز نگرفته.";
  return telegram(env, "sendMessage", { chat_id: chatId, text: `🏆 تالار کارآگاه‌ها\n\n${text}\n\nتو هم می‌تونی بیای بالای این لیست 🔥`, reply_markup: MENU });
}

async function achievements(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT achievement_id FROM player_achievements WHERE player_id = ?").bind(player.id).all();
  const unlocked = new Set(rows.results.map(r => r.achievement_id));
  const text = ACHIEVEMENTS.map(a => `${unlocked.has(a[0]) ? "🏅" : "🔒"} ${a[1]} — ${a[2]}`).join("\n");
  return telegram(env, "sendMessage", { chat_id: chatId, text: `🏅 دستاوردها\n\n${text}\n\nهرچی بیشتر بازی کنی، این لیست بیشتر پر می‌شه 😎`, reply_markup: MENU });
}

async function inventory(env, chatId, player) {
  const rows = await env.DB.prepare("SELECT item_id, quantity FROM player_inventory WHERE player_id = ?").bind(player.id).all();
  const names = Object.fromEntries(ITEMS);
  const text = rows.results.map(r => `${names[r.item_id] || r.item_id}: ${r.quantity}`).join("\n");
  return telegram(env, "sendMessage", { chat_id: chatId, text: `🎒 کوله‌بازیت\n\n${text || "فعلاً خالیه."}\n\nآیتم‌ها بعداً توی پرونده‌ها به کارت میان 😉`, reply_markup: MENU });
}

async function daily(env, chatId, player) {
  const today = new Date().toISOString().slice(0, 10);
  if (player.last_daily_claim === today) return telegram(env, "sendMessage", { chat_id: chatId, text: "🎯 مأموریت امروز رو قبلاً گرفتی!\n\nفردا دوباره یه مأموریت تازه داریم 😎", reply_markup: MENU });
  const newScore = (player.score || 0) + 25;
  const newStreak = (player.streak || 0) + 1;
  await env.DB.prepare("UPDATE players SET score=?, streak=?, last_daily_claim=?, updated_at=? WHERE id=?").bind(newScore, newStreak, today, new Date().toISOString(), player.id).run();
  return telegram(env, "sendMessage", { chat_id: chatId, text: `🎯 مأموریت امروز انجام شد!\n\n💰 +۲۵ امتیاز\n🔥 استریک: ${newStreak} روز\n\nهمین‌جوری ادامه بده کارآگاه؛ فردا هم یه جایزه داریم 👀`, reply_markup: MENU });
}

async function awardCaseScore(env, telegramId, playerId, caseId) {
  const c = getCase(caseId);
  if (!c) throw new Error(`unknown_case:${caseId}`);
  const rewardToken = createRewardToken();
  const now = new Date().toISOString();

  // Keep the whole reward operation atomic. Use the trusted playerId already
  // resolved from the active account, avoiding an extra player lookup/join.
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO case_rewards (player_id, case_id, reward_token, awarded_at)
      SELECT ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM player_progress
        WHERE player_id=? AND case_id=? AND solved=0
      )`).bind(playerId, caseId, rewardToken, now, playerId, caseId),
    env.DB.prepare(`UPDATE players
      SET score = score + ?,
          level = CAST((score + ?) / 500 AS INTEGER) + 1,
          updated_at=?
      WHERE id=?
        AND EXISTS (
          SELECT 1 FROM case_rewards
          WHERE player_id=? AND case_id=? AND reward_token=?
        )`).bind(c.reward, c.reward, now, playerId, playerId, caseId, rewardToken),
    env.DB.prepare(`UPDATE player_progress
      SET solved=1, current_step=current_step+1, updated_at=?
      WHERE player_id=? AND case_id=? AND solved=0
        AND EXISTS (
          SELECT 1 FROM case_rewards
          WHERE player_id=? AND case_id=? AND reward_token=?
        )`).bind(now, playerId, caseId, playerId, caseId, rewardToken)
  ]);

  const inserted = Number(result[0]?.meta?.changes || 0);
  const updated = Number(result[1]?.meta?.changes || 0);
  const progressUpdated = Number(result[2]?.meta?.changes || 0);
  if (!inserted || !updated || !progressUpdated) {
    logEvent("game_reward_not_recorded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, inserted, updated, progressUpdated });
    return false;
  }
  logEvent("game_reward_awarded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, points: c.reward });
  return true;
}

async function unlockAchievements(env, playerId) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS solved FROM player_progress WHERE player_id=? AND solved=1").bind(playerId).first();
  const solved = Number(row?.solved || 0);
  const wanted = solved >= 10 ? ["first-case","three-cases","five-cases","ten-cases"] : solved >= 5 ? ["first-case","three-cases","five-cases"] : solved >= 3 ? ["first-case","three-cases"] : solved >= 1 ? ["first-case"] : [];
  for (const id of wanted) await env.DB.prepare("INSERT OR IGNORE INTO player_achievements (player_id, achievement_id, unlocked_at) VALUES (?, ?, ?)").bind(playerId, id, new Date().toISOString()).run();
}

async function handleCallback(env, query) {
  const chatId = query.message.chat.id;
  const player = await requireAccount(env, chatId, query.from.id);
  await telegram(env, "answerCallbackQuery", { callback_query_id: query.id });
  if (!player) return;
  const data = query.data;
  if (data === "menu:home") return sendMenu(env, chatId);
  if (data === "menu:cases") return showCases(env, chatId, player);
  if (data === "menu:profile") return profile(env, chatId, player);
  if (data === "menu:rank") return rank(env, chatId, player);
  if (data === "menu:achievements") return achievements(env, chatId, player);
  if (data === "menu:inventory") return inventory(env, chatId, player);
  if (data === "menu:daily") return daily(env, chatId, player);
  if (data === "menu:help") return telegram(env, "sendMessage", { chat_id: chatId, text: "ℹ️ راهنمای سریع\n\n🔎 پرونده رو انتخاب کن.\n🔍 سرنخ‌ها رو بخون.\n🧩 معما رو حل کن.\n🏆 امتیاز بگیر.\n🏅 دستاورد باز کن.\n🎒 آیتم جمع کن.\n🎯 هر روز هم مأموریت داری.\n\nاگه جایی گیر کردی، اول همه سرنخ‌ها رو کنار هم بذار؛ رازگشا با حدس کور جلو نمی‌ره 😉", reply_markup: MENU });
  if (data.startsWith("case:")) return startCase(env, chatId, player, data.slice(5));
  if (data.startsWith("clue:")) {
    const [, caseId, index] = data.split(":"); const c = getCase(caseId); const clue = c?.clues[Number(index)];
    if (!clue) return sendMenu(env, chatId, "این سرنخ دیگه در دسترس نیست 😅");
    return telegram(env, "sendMessage", { chat_id: chatId, text: `🔍 سرنخ ${Number(index) + 1}\n\n${clue}\n\nحواست جمع باشه... این جزئیات ممکنه بعداً به کارت بیاد 👀`, reply_markup: { inline_keyboard: [[{ text: "🧩 معما", callback_data: `puzzle:${caseId}` }], [{ text: "📁 پرونده‌ها", callback_data: "menu:cases" }, { text: "🏠 منو", callback_data: "menu:home" }]] } });
  }
  if (data.startsWith("puzzle:")) {
    const c = getCase(data.slice(7)); if (!c) return sendMenu(env, chatId, "پرونده پیدا نشد 😅");
    return telegram(env, "sendMessage", { chat_id: chatId, text: `🧩 خب... رسیدیم به اصل ماجرا!\n\n${c.question}\n\nفقط یکی از این جواب‌ها با شواهد جور درمیاد.`, reply_markup: { inline_keyboard: c.options.map((o, i) => [{ text: `${String.fromCharCode(65 + i)}) ${o}`, callback_data: `answer:${c.id}:${i}` }]) } });
  }
  if (data.startsWith("answer:")) {
    const [, caseId, raw] = data.split(":"); const c = getCase(caseId); const index = Number(raw);
    if (!c || !c.options[index]) return sendMenu(env, chatId, "این جواب دیگه معتبر نیست 😅");
    if (index !== c.answer) return telegram(env, "sendMessage", { chat_id: chatId, text: `❌ نه، این یکی با شواهد جور درنمیاد.\n\n${c.question}\n\nیه بار دیگه سرنخ‌ها رو مرور کن؛ عجله نکن کارآگاه 😉`, reply_markup: { inline_keyboard: [[{ text: "🧩 دوباره تلاش می‌کنم", callback_data: `puzzle:${c.id}` }], [{ text: "🔍 دیدن سرنخ‌ها", callback_data: `case:${c.id}` }]] } });
    try {
      const awarded = await awardCaseScore(env, query.from.id, player.id, c.id);
      if (!awarded) return telegram(env, "sendMessage", { chat_id: chatId, text: "✅ این پرونده رو قبلاً حل کردی و امتیازش هم قبلاً ثبت شده.\n\nبریم سراغ پرونده بعدی؟ 😎", reply_markup: MENU });
    } catch (error) {
      logEvent("game_answer_error", { telegram_id: String(query.from.id), player_id: player.id, case_id: c.id, message: error?.message || "unknown" });
      return telegram(env, "sendMessage", { chat_id: chatId, text: "⚠️ جواب درست بود، اما ثبت امتیاز با خطای موقت روبه‌رو شد. چند لحظه بعد دوباره همین گزینه رو بزن. 👀" });
    }

    // Achievement failure must never turn a successfully awarded case into a
    // misleading error message. It is best-effort and can be retried later.
    try {
      await unlockAchievements(env, player.id);
    } catch (error) {
      logEvent("achievement_unlock_error", { telegram_id: String(query.from.id), player_id: player.id, case_id: c.id, message: error?.message || "unknown" });
    }

    return telegram(env, "sendMessage", { chat_id: chatId, text: `${c.success}\n\n💰 +${c.reward} امتیاز\n\n📁 پرونده ثبت شد. پرونده بعدی باز شد 🔓`, reply_markup: { inline_keyboard: [[{ text: "📁 پرونده بعدی", callback_data: "menu:cases" }], [{ text: "👤 پروفایل", callback_data: "menu:profile" }, { text: "🏆 رتبه‌بندی", callback_data: "menu:rank" }]] } });
  }
  return sendMenu(env, chatId, "این دکمه دیگه کاربردی نداره 😅");
}

async function handleMessage(env, message) {
  const chatId = message.chat.id;
  if (message.text === "/start") {
    const player = await createAccount(env, message.from);
    return sendMenu(env, chatId, `🕵️ سلام ${esc(player.detective_name || player.first_name)}!\n\nحساب کارآگاهی‌ات ساخته شد و از اینجا به بعد همه‌چی برای خودته.\n\n۱۰ پرونده منتظرتـه؛ بریم ببینیم چندتاشو می‌تونی حل کنی 😎🔥`);
  }
  const player = await requireAccount(env, chatId, message.from.id);
  if (!player) return;
  if (message.text === "/menu") return sendMenu(env, chatId);
  if (message.text === "/profile") return profile(env, chatId, player);
  if (message.text === "/rank") return rank(env, chatId, player);
  if (message.text === "/cases") return showCases(env, chatId, player);
  return sendMenu(env, chatId, "حاجی اینو نفهمیدم 😅\n\nاز دکمه‌های منو استفاده کن یا /menu رو بزن.");
}

export default { async fetch(request, env) {
  try {
    if (request.method === "GET") return new Response("Razgosha is running 🕵️", { status: 200 });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const update = await request.json();
    if (update.callback_query) await handleCallback(env, update.callback_query);
    else if (update.message) await handleMessage(env, update.message);
    return new Response("ok", { status: 200 });
  } catch (error) {
    logEvent("worker_error", { message: error?.message || "unknown" });
    return new Response("ok", { status: 200 });
  }
} };