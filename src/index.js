import { createRewardToken, getSafeErrorMessage } from "./game-guards.js";

const MENU = {
  inline_keyboard: [
    [{ text: "🔎 شروع بازی", callback_data: "menu:start" }, { text: "📁 پرونده‌ها", callback_data: "menu:cases" }],
    [{ text: "🏆 رتبه‌بندی", callback_data: "menu:rank" }, { text: "👤 پروفایل", callback_data: "menu:profile" }],
    [{ text: "ℹ️ راهنما", callback_data: "menu:help" }]
  ]
};

const CASES = {
  "case-001": {
    id: "case-001",
    title: "پرونده ۰۰۱ — آخرین قطار",
    intro: "ساعت ۲۳:۴۷ است. قطار شبانهٔ شماره ۷ در ایستگاه مترو متوقف شده، اما یکی از مسافران ناپدید شده است. درِ واگن از داخل قفل بوده و چهار نفر آخرین کسانی هستند که او را دیده‌اند.",
    suspects: [
      ["سارا", "مسئول بلیت‌فروشی ایستگاه"],
      ["مانی", "مسافر واگن آخر"],
      ["کاوه", "تعمیرکار شیفت شب"],
      ["نیما", "نگهبان سکو"]
    ],
    clues: [
      ["ساعت مچی", "ساعت قربانی دقیقاً ۲۳:۳۱ متوقف شده است."],
      ["بلیط پاره", "نیمی از یک بلیت در سطل زباله پیدا شده است."],
      ["دوربین", "دوربین راهروی واگن بین ۲۳:۲۹ تا ۲۳:۳۴ قطع بوده است."],
      ["کلید تعمیرات", "یک کلید مخصوص پنل اضطراری نزدیک صندلی قربانی پیدا شده است."]
    ],
    puzzle: {
      question: "کدام بازهٔ زمانی برای بررسی دقیق‌تر مهم‌تر است؟",
      options: [["۲۳:۰۰ تا ۲۳:۱۰", false], ["۲۳:۲۹ تا ۲۳:۳۴", true], ["۲۳:۴۰ تا ۲۳:۴۵", false], ["۰۰:۰۰ تا ۰۰:۱۰", false]]
    },
    endings: {
      correct: "🎯 عالی بود! سرنخ‌ها را درست کنار هم گذاشتی. اختلال دوربین دقیقاً با زمان ناپدیدشدن قربانی هم‌زمان است.",
      wrong: "❌ این فرضیه با شواهد جور درنمی‌آید. یک بار دیگر سرنخ‌ها را بررسی کن."
    }
  }
};

function logEvent(event, details = {}) {
  console.log(JSON.stringify({
    event,
    ...details,
    timestamp: new Date().toISOString()
  }));
}

async function telegram(env, method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      logEvent("telegram_error", { method, status: response.status, description: result.description || "unknown" });
    }
    return result;
  } catch (error) {
    logEvent("telegram_error", { method, message: error?.message || "network_error" });
    throw error;
  }
}

function esc(text) {
  return String(text).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

async function ensurePlayer(env, from) {
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO players (telegram_id, username, first_name, score, level, created_at, updated_at)
      VALUES (?, ?, ?, 0, 1, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name, updated_at=excluded.updated_at`)
      .bind(String(from.id), from.username || null, from.first_name || "کارآگاه", now, now).run();
    return await env.DB.prepare("SELECT * FROM players WHERE telegram_id = ?").bind(String(from.id)).first();
  } catch (error) {
    logEvent("db_error", { operation: "ensure_player", telegram_id: String(from.id), message: error?.message || "unknown" });
    throw error;
  }
}

async function sendMenu(env, chatId, text = "🕵️ به رازگشا خوش آمدی!\n\nآماده‌ای اولین پرونده‌ات را حل کنی؟") {
  return telegram(env, "sendMessage", { chat_id: chatId, text, reply_markup: MENU });
}

async function startCase(env, chatId, telegramId) {
  const c = CASES["case-001"];
  try {
    await env.DB.prepare(`INSERT INTO player_progress (player_id, case_id, current_step, solved, updated_at)
      SELECT id, ?, 0, 0, ? FROM players WHERE telegram_id = ?
      ON CONFLICT(player_id, case_id) DO NOTHING`).bind(c.id, new Date().toISOString(), String(telegramId)).run();
  } catch (error) {
    logEvent("db_error", { operation: "start_case", telegram_id: String(telegramId), case_id: c.id, message: error?.message || "unknown" });
    throw error;
  }
  return telegram(env, "sendMessage", {
    chat_id: chatId,
    text: `📁 ${c.title}\n\n${c.intro}\n\n👥 مظنون‌ها:\n${c.suspects.map((s, i) => `${i + 1}. ${s[0]} — ${s[1]}`).join("\n")}\n\nحالا اولین سرنخ را انتخاب کن.`,
    reply_markup: { inline_keyboard: c.clues.map((clue, i) => [{ text: `🔍 ${clue[0]}`, callback_data: `clue:${i}` }]).concat([[{ text: "🧩 حل معما", callback_data: "case:puzzle" }], [{ text: "🏠 منوی اصلی", callback_data: "menu:home" }]]) }
  });
}

async function profile(env, chatId, player) {
  return telegram(env, "sendMessage", { chat_id: chatId, text: `👤 پروفایل کارآگاه\n\nنام: ${esc(player.first_name || "کارآگاه")}\nامتیاز: ${player.score}\nسطح: ${player.level}\n\n🕵️ ادامه بده؛ پرونده‌های بیشتری در راه است!`, reply_markup: MENU });
}

async function rank(env, chatId) {
  try {
    const rows = await env.DB.prepare("SELECT first_name, username, score FROM players ORDER BY score DESC, id ASC LIMIT 10").all();
    const text = rows.results.length ? rows.results.map((p, i) => `${i + 1}. ${p.first_name || "کارآگاه"} — ${p.score} امتیاز`).join("\n") : "هنوز کسی امتیازی ثبت نکرده است.";
    return telegram(env, "sendMessage", { chat_id: chatId, text: `🏆 رتبه‌بندی رازگشا\n\n${text}`, reply_markup: MENU });
  } catch (error) {
    logEvent("db_error", { operation: "rank", chat_id: String(chatId), message: error?.message || "unknown" });
    throw error;
  }
}

async function awardCaseScore(env, telegramId, playerId, caseId) {
  const rewardToken = createRewardToken();
  const now = new Date().toISOString();

  try {
    const result = await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO case_rewards (player_id, case_id, reward_token, awarded_at)
        SELECT id, ?, ?, ? FROM players p
        JOIN player_progress pp ON pp.player_id = p.id AND pp.case_id = ?
        WHERE p.telegram_id = ? AND pp.solved = 0`)
        .bind(caseId, rewardToken, now, caseId, String(telegramId)),
      env.DB.prepare(`UPDATE players
        SET score = score + 100,
            level = CAST((score + 100) / 500 AS INTEGER) + 1,
            updated_at = ?
        WHERE telegram_id = ?
          AND EXISTS (
            SELECT 1 FROM case_rewards cr
            WHERE cr.player_id = players.id AND cr.case_id = ? AND cr.reward_token = ?
          )`)
        .bind(now, String(telegramId), caseId, rewardToken),
      env.DB.prepare(`UPDATE player_progress
        SET solved = 1,
            current_step = current_step + 1,
            updated_at = ?
        WHERE player_id = ? AND case_id = ? AND solved = 0
          AND EXISTS (
            SELECT 1 FROM case_rewards cr
            WHERE cr.player_id = player_progress.player_id AND cr.case_id = ? AND cr.reward_token = ?
          )`)
        .bind(now, playerId, caseId, caseId, rewardToken)
    ]);

    const scoreUpdate = result[1]?.meta?.changes || 0;
    if (scoreUpdate === 0) {
      logEvent("game_duplicate_reward_blocked", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId });
      return false;
    }

    logEvent("game_reward_awarded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, points: 100 });
    return true;
  } catch (error) {
    logEvent("db_error", { operation: "award_case_score", telegram_id: String(telegramId), player_id: playerId, case_id: caseId, message: error?.message || "unknown" });
    throw error;
  }
}

async function handleCallback(env, query) {
  const chatId = query.message.chat.id;
  const data = query.data;
  const player = await ensurePlayer(env, query.from);
  await telegram(env, "answerCallbackQuery", { callback_query_id: query.id });

  if (data === "menu:home") return sendMenu(env, chatId);
  if (data === "menu:start") return startCase(env, chatId, query.from.id);
  if (data === "menu:cases") return telegram(env, "sendMessage", { chat_id: chatId, text: "📁 پرونده‌های فعلی\n\n🟢 پرونده ۰۰۱ — آخرین قطار\n\nپرونده‌های بعدی به‌زودی باز می‌شوند.", reply_markup: { inline_keyboard: [[{ text: "🔎 شروع پرونده ۰۰۱", callback_data: "menu:start" }], [{ text: "🏠 منوی اصلی", callback_data: "menu:home" }]] } });
  if (data === "menu:profile") return profile(env, chatId, player);
  if (data === "menu:rank") return rank(env, chatId);
  if (data === "menu:help") return telegram(env, "sendMessage", { chat_id: chatId, text: "ℹ️ راهنمای رازگشا\n\n🔎 پرونده را شروع کن.\n🔍 سرنخ‌ها را بررسی کن.\n🧩 معماها را حل کن.\n🎯 در پایان بر اساس شواهد تصمیم بگیر.\n🏆 امتیاز بگیر و در رتبه‌بندی بالا برو.", reply_markup: MENU });

  if (data.startsWith("clue:")) {
    const index = Number(data.split(":")[1]);
    const clue = CASES["case-001"].clues[index];
    if (!clue) return sendMenu(env, chatId, "⚠️ این سرنخ دیگر در دسترس نیست. از منوی اصلی دوباره پرونده را باز کن.");
    return telegram(env, "sendMessage", { chat_id: chatId, text: `🔍 ${clue[0]}\n\n${clue[1]}\n\nهر سرنخ ممکن است بخشی از حقیقت را آشکار کند.`, reply_markup: { inline_keyboard: [[{ text: "🧩 رفتن به معما", callback_data: "case:puzzle" }], [{ text: "🔎 سرنخ بعدی", callback_data: "menu:start" }], [{ text: "🏠 منوی اصلی", callback_data: "menu:home" }]] } });
  }

  if (data === "case:puzzle") {
    const p = CASES["case-001"].puzzle;
    return telegram(env, "sendMessage", { chat_id: chatId, text: `🧩 معمای پرونده\n\n${p.question}`, reply_markup: { inline_keyboard: p.options.map((o, i) => [{ text: o[0], callback_data: `answer:${i}` }]) } });
  }

  if (data.startsWith("answer:")) {
    const index = Number(data.split(":")[1]);
    const option = CASES["case-001"].puzzle.options[index];
    if (!option) return sendMenu(env, chatId, "⚠️ این گزینه دیگر معتبر نیست. از منوی اصلی دوباره تلاش کن.");

    const correct = option[1] === true;
    if (correct) {
      const awarded = await awardCaseScore(env, query.from.id, player.id, "case-001");
      if (!awarded) {
        return telegram(env, "sendMessage", { chat_id: chatId, text: "✅ این پرونده را قبلاً حل کرده‌ای و امتیازش قبلاً ثبت شده است.\n\n🏆 برای پرونده بعدی آماده باش!", reply_markup: MENU });
      }
      return telegram(env, "sendMessage", { chat_id: chatId, text: `${CASES["case-001"].endings.correct}\n\n💯 +۱۰۰ امتیاز\n\nپرونده فعلاً به پایان رسید.`, reply_markup: MENU });
    }
    return telegram(env, "sendMessage", { chat_id: chatId, text: `${CASES["case-001"].endings.wrong}\n\n💡 به بازه‌ای که دوربین قطع شده بود دقت کن.`, reply_markup: { inline_keyboard: [[{ text: "🧩 دوباره تلاش می‌کنم", callback_data: "case:puzzle" }], [{ text: "🏠 منوی اصلی", callback_data: "menu:home" }]] } });
  }
}

async function handleUpdate(env, update) {
  if (update.callback_query) return handleCallback(env, update.callback_query);
  const message = update.message;
  if (!message?.from || !message.chat) return;
  const player = await ensurePlayer(env, message.from);
  const text = (message.text || "").trim();
  if (text === "/start" || text === "/menu") return sendMenu(env, message.chat.id);
  if (text === "/profile") return profile(env, message.chat.id, player);
  if (text === "/rank") return rank(env, message.chat.id);
  return sendMenu(env, message.chat.id, "🕵️ پیام را متوجه نشدم. از منوی زیر انتخاب کن:");
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Razgosha is running 🕵️", { status: 200 });

    let update = null;
    try {
      update = await request.json();
      await handleUpdate(env, update);
      return new Response("OK");
    } catch (error) {
      const telegramId = update?.callback_query?.from?.id || update?.message?.from?.id;
      logEvent("worker_error", { telegram_id: telegramId ? String(telegramId) : undefined, message: error?.message || "unknown" });

      const chatId = update?.callback_query?.message?.chat?.id || update?.message?.chat?.id;
      if (chatId) {
        try {
          await telegram(env, "sendMessage", { chat_id: chatId, text: getSafeErrorMessage(error), reply_markup: MENU });
        } catch (telegramError) {
          logEvent("telegram_error", { method: "sendMessage:error_recovery", message: telegramError?.message || "unknown" });
        }
      }

      return new Response("OK", { status: 200 });
    }
  }
};
