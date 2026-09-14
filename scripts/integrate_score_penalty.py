from pathlib import Path

p = Path("src/index.js")
s = p.read_text(encoding="utf-8")

IMPORT = 'import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";'
if IMPORT not in s:
    s = s.replace(
        'import { getCasePage, getUnlockedCaseId } from "./case-pagination.js";\n',
        'import { getCasePage, getUnlockedCaseId } from "./case-pagination.js";\n' + IMPORT + '\n'
    )

s = s.replace(
    '4️⃣ هر پرونده فقط یک‌بار امتیاز اصلی خودش رو می‌ده.\\n5️⃣ پرونده‌ها به‌ترتیب باز می‌شن.',
    '4️⃣ هر پرونده فقط یک‌بار امتیاز اصلی خودش رو می‌ده.\\n5️⃣ هر پاسخ اشتباه امتیاز همین پرونده رو کاهش می‌ده: ۵۰٪، بعد ۲۵٪، و بعد صفر.\\n6️⃣ پرونده‌ها به‌ترتیب باز می‌شن.'
)
s = s.replace(
    '🎯 مأموریت روزانه هم می‌تونه به امتیازت اضافه کنه.\\n\\n🔥 هدف فقط حل کردن نیست؛ حرفه‌ای‌تر حل کن و بالاتر برو.',
    '🎯 مأموریت روزانه هم می‌تونه به امتیازت اضافه کنه.\\n\\n⚠️ پاسخ اشتباه امتیاز پرونده رو کم می‌کنه: ۱ اشتباه = نصف، ۲ اشتباه = یک‌چهارم، ۳ اشتباه = صفر.\\n\\n🔥 هدف فقط حل کردن نیست؛ حرفه‌ای‌تر حل کن و بالاتر برو.'
)

s = s.replace(
    'SELECT current_step, solved FROM player_progress WHERE player_id=? AND case_id=?',
    'SELECT current_step, solved, wrong_guesses FROM player_progress WHERE player_id=? AND case_id=?'
)
s = s.replace(
    'SELECT case_id, current_step FROM player_progress WHERE player_id=? AND solved=0 ORDER BY updated_at DESC, id DESC LIMIT 1',
    'SELECT case_id, current_step, wrong_guesses FROM player_progress WHERE player_id=? AND solved=0 ORDER BY updated_at DESC, id DESC LIMIT 1'
)

s = s.replace(
    'INSERT INTO player_progress (player_id, case_id, current_step, solved, updated_at) VALUES (?, ?, 0, 0, ?) ON CONFLICT(player_id, case_id) DO UPDATE SET current_step=0, solved=0, updated_at=excluded.updated_at',
    'INSERT INTO player_progress (player_id, case_id, current_step, solved, wrong_guesses, updated_at) VALUES (?, ?, 0, 0, 0, ?) ON CONFLICT(player_id, case_id) DO UPDATE SET current_step=0, solved=0, wrong_guesses=0, updated_at=excluded.updated_at'
)

s = s.replace(
    'return sendMessage(env, chatId, `📂 ${c.title}\\n\\n${c.intro}\\n\\n👥 مظنون‌ها:\\n${c.suspects.map((x, i) => `${i + 1}. ${x}`).join("\\n")}\\n\\n🧩 مرحله ${step + 1}/${getStageCount(c)} — ${stage?.title || "بررسی شواهد"}\\n\\nسرنخ‌ها رو با دقت بررسی کن؛ عجله نکن 👀`, caseKeyboard(c, step), 1100, "🕵️");',
    'const activeWarning = isFinalStage(c, step) ? `\\n\\n${getMistakeWarning(Number(existing?.wrong_guesses || 0))}` : "";\n  return sendMessage(env, chatId, `📂 ${c.title}\\n\\n${c.intro}\\n\\n👥 مظنون‌ها:\\n${c.suspects.map((x, i) => `${i + 1}. ${x}`).join("\\n")}\\n\\n🧩 مرحله ${step + 1}/${getStageCount(c)} — ${stage?.title || "بررسی شواهد"}\\n\\nسرنخ‌ها رو با دقت بررسی کن؛ عجله نکن 👀${activeWarning}`, caseKeyboard(c, step), 1100, "🕵️");'
)
s = s.replace(
    'return c ? { ...c, current_step: Number(row.current_step || 0) } : null;',
    'return c ? { ...c, current_step: Number(row.current_step || 0), wrong_guesses: Number(row.wrong_guesses || 0) } : null;'
)

old_award = '''async function awardCaseScore(env, telegramId, playerId, caseId) {
  const c = getCase(caseId);
  if (!c) throw new Error(`unknown_case:${caseId}`);
  const rewardToken = createRewardToken();
  const now = new Date().toISOString();
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO case_rewards (player_id, case_id, reward_token, awarded_at)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM player_progress WHERE player_id=? AND case_id=? AND solved=0)`).bind(playerId, caseId, rewardToken, now, playerId, caseId),
    env.DB.prepare(`UPDATE players SET score=score+?, level=CAST((score+?)/500 AS INTEGER)+1, updated_at=? WHERE id=? AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(c.reward, c.reward, now, playerId, playerId, caseId, rewardToken),
    env.DB.prepare(`UPDATE player_progress SET solved=1, current_step=current_step+1, updated_at=? WHERE player_id=? AND case_id=? AND solved=0 AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(now, playerId, caseId, playerId, caseId, rewardToken)
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
}'''
new_award = '''async function awardCaseScore(env, telegramId, playerId, caseId) {
  const c = getCase(caseId);
  if (!c) throw new Error(`unknown_case:${caseId}`);
  const progress = await env.DB.prepare("SELECT wrong_guesses FROM player_progress WHERE player_id=? AND case_id=? AND solved=0").bind(playerId, caseId).first();
  const points = calculateCaseScore(c.reward, progress?.wrong_guesses || 0);
  const rewardToken = createRewardToken();
  const now = new Date().toISOString();
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO case_rewards (player_id, case_id, reward_token, awarded_at)
      SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM player_progress WHERE player_id=? AND case_id=? AND solved=0)`).bind(playerId, caseId, rewardToken, now, playerId, caseId),
    env.DB.prepare(`UPDATE players SET score=score+?, level=CAST((score+?)/500 AS INTEGER)+1, updated_at=? WHERE id=? AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(points, points, now, playerId, playerId, caseId, rewardToken),
    env.DB.prepare(`UPDATE player_progress SET solved=1, current_step=current_step+1, updated_at=? WHERE player_id=? AND case_id=? AND solved=0 AND EXISTS (SELECT 1 FROM case_rewards WHERE player_id=? AND case_id=? AND reward_token=?)`).bind(now, playerId, caseId, playerId, caseId, rewardToken)
  ]);
  const inserted = Number(result[0]?.meta?.changes || 0);
  const updated = Number(result[1]?.meta?.changes || 0);
  const progressUpdated = Number(result[2]?.meta?.changes || 0);
  if (!inserted || !updated || !progressUpdated) {
    logEvent("game_reward_not_recorded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, inserted, updated, progressUpdated });
    return false;
  }
  logEvent("game_reward_awarded", { telegram_id: String(telegramId), player_id: playerId, case_id: caseId, points, base_points: c.reward, wrong_guesses: Number(progress?.wrong_guesses || 0) });
  return { awarded: true, points };
}'''
if old_award in s:
    s = s.replace(old_award, new_award)

s = s.replace(
    'if (isFinalStage(activeCase, nextStep)) return sendMessage(env, chatId, `🧩 مرحله نهایی\\n\\n${nextStage.question}\\n\\nحالا همه شواهد رو کنار هم بذار.`, puzzleKeyboard(nextStage), 1000, "🧩");',
    'if (isFinalStage(activeCase, nextStep)) return sendMessage(env, chatId, `🧩 مرحله نهایی\\n\\n${nextStage.question}\\n\\nحالا همه شواهد رو کنار هم بذار.\\n\\n${getMistakeWarning(activeCase.wrong_guesses)}`, puzzleKeyboard(nextStage), 1000, "🧩");'
)
s = s.replace(
    'return sendMessage(env, chatId, `🧩 خب... رسیدیم به اصل ماجرا!\\n\\n${stage.question}\\n\\nفقط یکی از این جواب‌ها با شواهد جور درمیاد.`, puzzleKeyboard(stage), 950, "🧩");',
    'return sendMessage(env, chatId, `🧩 خب... رسیدیم به اصل ماجرا!\\n\\n${stage.question}\\n\\n${getMistakeWarning(activeCase.wrong_guesses)}\\n\\nفقط یکی از این جواب‌ها با شواهد جور درمیاد.`, puzzleKeyboard(stage), 950, "🧩");'
)

old_wrong = 'if (index !== finalCase.answer) return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.\\n\\n${finalCase.question}\\n\\nیه بار دیگه همه شواهد رو مرور کن؛ عجله نکن کارآگاه 😉`, puzzleKeyboard(finalCase), 850, "🤔");'
new_wrong = '''if (index !== finalCase.answer) {
        const mistake = await recordCaseMistake(env, player.id, activeCase.id);
        const warning = getMistakeWarning(mistake.wrongGuesses);
        const penaltyText = mistake.wrongGuesses >= 3
          ? "💥 امتیاز این پرونده دیگه صفره."
          : `📉 ضریب امتیاز این پرونده: ${Math.round((1 / (2 ** mistake.wrongGuesses)) * 100)}٪`;
        return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.\\n\\n${penaltyText}\\n\\n${warning}\\n\\n${finalCase.question}\\n\\nدوباره شواهد رو مرور کن؛ این بار با دقت‌تر کارآگاه 😉`, puzzleKeyboard(finalCase), 850, "🤔");
      }'''
if old_wrong in s:
    s = s.replace(old_wrong, new_wrong)

s = s.replace('💰 +${activeCase.reward} امتیاز', '💰 +${awarded.points} امتیاز')

p.write_text(s, encoding="utf-8")
