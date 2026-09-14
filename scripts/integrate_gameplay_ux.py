from pathlib import Path

p = Path("src/index.js")
s = p.read_text(encoding="utf-8")

s = s.replace('import { CASES, getCase } from "./cases.js";', 'import { CASES, getCase } from "./cases.js";\nimport { getStage, getStageClues, getStageCount, isFinalStage } from "./stage-engine.js";\nimport { getCasePage, getUnlockedCaseId } from "./case-pagination.js";')
s = s.replace('هر ده پرونده فعلی رو حل کن 👑', 'هر ۶۰ پرونده رو حل کن 👑')
s = s.replace('۱۰ پرونده منتظرتـه', 'ده‌ها پرونده منتظرتـه')
s = s.replace('const CLUE_LABELS = ["🔍 سرنخ ۱", "🔍 سرنخ ۲", "🔍 سرنخ ۳", "🔍 سرنخ ۴"];', 'const CLUE_LABELS = ["🔍 سرنخ ۱", "🔍 سرنخ ۲", "🔍 سرنخ ۳", "🔍 سرنخ ۴"];\nconst NEXT_STAGE = "➡️ مرحله بعد";')

start = s.index('function caseListKeyboard() {')
end = s.index('\nfunction caseButton(c) {', start)
s = s[:start] + '''function caseListKeyboard(page = 1) {
  const { page: currentPage, totalPages } = getCasePage(CASES, page);
  const rows = [];
  const nav = [];
  if (currentPage > 1) nav.push("◀️ صفحه قبل");
  if (currentPage < totalPages) nav.push("صفحه بعد ▶️");
  if (nav.length) rows.push(nav);
  rows.push(["🎯 پرونده قابل انجام"]);
  rows.push([BACK]);
  return keyboard(rows, `پرونده‌ها — صفحه ${currentPage} از ${totalPages}`);
}'''+s[end:]

start = s.index('function caseKeyboard(c) {')
end = s.index('\nfunction puzzleKeyboard(c) {', start)
s = s[:start] + '''function caseKeyboard(c, step = 0) {
  const clues = getStageClues(c, step);
  const rows = [];
  for (let i = 0; i < clues.length; i += 2) {
    const row = [CLUE_LABELS[i] || `🔍 سرنخ ${i + 1}`];
    if (clues[i + 1]) row.push(CLUE_LABELS[i + 1] || `🔍 سرنخ ${i + 2}`);
    rows.push(row);
  }
  rows.push([isFinalStage(c, step) ? PUZZLE_LABEL : NEXT_STAGE]);
  rows.push([CASES_LABEL, BACK]);
  return keyboard(rows, isFinalStage(c, step) ? "معمای نهایی آماده‌ست..." : "شواهد رو بررسی کن...");
}'''+s[end:]

start = s.index('async function showCases(env, chatId, player) {')
end = s.index('\nasync function startCase(', start)
s = s[:start] + '''async function showCases(env, chatId, player, page = 1) {
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const progress = new Map(rows.results.map(r => [r.case_id, Number(r.solved || 0)]));
  const solvedIds = new Set([...progress].filter(([, solved]) => solved).map(([id]) => id));
  const { items, page: currentPage, totalPages } = getCasePage(CASES, page);
  const unlockedId = getUnlockedCaseId(CASES, solvedIds);
  const lines = items.map(c => {
    const solved = progress.get(c.id) === 1;
    const unlocked = c.id === unlockedId;
    return `${solved ? "✅" : unlocked ? "🟢" : "🔒"} ${c.title} — ${c.difficulty} — ${c.reward} امتیاز`;
  }).join("\\n");
  const target = getCase(unlockedId);
  const text = `📁 آرشیو پرونده‌ها\\n\\n${lines}\\n\\n📄 صفحه ${currentPage} از ${totalPages}\\n\\n${target ? `🎯 پرونده قابل انجام: ${target.title}\\nبا دکمه «پرونده قابل انجام» شروعش کن.` : "👑 همه پرونده‌های فعلی رو حل کردی!"}`;
  return sendMessage(env, chatId, text, caseListKeyboard(currentPage), 750, "🔍");
}'''+s[end:]

start = s.index('async function startCase(env, chatId, player, caseId) {')
end = s.index('\nasync function getActiveCase(', start)
s = s[:start] + '''async function startCase(env, chatId, player, caseId) {
  const c = getCase(caseId);
  if (!c) return sendMenu(env, chatId, "این پرونده رو پیدا نکردم 😅", "🤔");
  const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
  const solved = new Set(rows.results.filter(r => r.solved).map(r => r.case_id));
  const idx = CASES.findIndex(x => x.id === caseId);
  if (idx > 0 && !solved.has(CASES[idx - 1].id)) return sendMenu(env, chatId, "🔒 این پرونده هنوز باز نیست. اول پرونده بعدیِ مسیرت رو حل کن 😉", "🔒");
  const existing = await env.DB.prepare("SELECT current_step, solved FROM player_progress WHERE player_id=? AND case_id=?").bind(player.id, c.id).first();
  if (!existing || existing.solved) {
    await env.DB.prepare(`INSERT INTO player_progress (player_id, case_id, current_step, solved, updated_at) VALUES (?, ?, 0, 0, ?) ON CONFLICT(player_id, case_id) DO UPDATE SET current_step=0, solved=0, updated_at=excluded.updated_at`).bind(player.id, c.id, new Date().toISOString()).run();
  }
  const step = existing && !existing.solved ? Number(existing.current_step || 0) : 0;
  const stage = getStage(c, step);
  return sendMessage(env, chatId, `📂 ${c.title}\\n\\n${c.intro}\\n\\n👥 مظنون‌ها:\\n${c.suspects.map((x, i) => `${i + 1}. ${x}`).join("\\n")}\\n\\n🧩 مرحله ${step + 1}/${getStageCount(c)} — ${stage?.title || "بررسی شواهد"}\\n\\nسرنخ‌ها رو با دقت بررسی کن؛ عجله نکن 👀`, caseKeyboard(c, step), 1100, "🕵️");
}'''+s[end:]

start = s.index('async function getActiveCase(env, playerId) {')
end = s.index('\nasync function profile(', start)
s = s[:start] + '''async function getActiveCase(env, playerId) {
  const row = await env.DB.prepare("SELECT case_id, current_step FROM player_progress WHERE player_id=? AND solved=0 ORDER BY updated_at DESC, id DESC LIMIT 1").bind(playerId).first();
  if (!row) return null;
  const c = getCase(row.case_id);
  return c ? { ...c, current_step: Number(row.current_step || 0) } : null;
}'''+s[end:]

s = s.replace('const wanted = solved >= 10 ? ["first-case", "three-cases", "five-cases", "ten-cases"] : solved >= 5 ? ["first-case", "three-cases", "five-cases"] : solved >= 3 ? ["first-case", "three-cases"] : solved >= 1 ? ["first-case"] : [];', '''const wanted = [];
  if (solved >= 1) wanted.push("first-case");
  if (solved >= 3) wanted.push("three-cases");
  if (solved >= 5) wanted.push("five-cases");
  if (solved >= 10) wanted.push("ten-cases");
  if (solved >= 20) wanted.push("twenty-cases");
  if (solved >= 30) wanted.push("thirty-cases");
  if (solved >= 50) wanted.push("fifty-cases");
  if (solved >= 60) wanted.push("sixty-cases");''')

needle = '  if (text === "/cases" || text === "🔎 پرونده‌ها" || text === CASES_LABEL) return showCases(env, chatId, player);'
replacement = '''  if (text === "/cases" || text === "🔎 پرونده‌ها" || text === CASES_LABEL) return showCases(env, chatId, player, 1);
  if (text === "🎯 پرونده قابل انجام") {
    const rows = await env.DB.prepare("SELECT case_id, solved FROM player_progress WHERE player_id = ?").bind(player.id).all();
    const solvedIds = new Set(rows.results.filter(r => r.solved).map(r => r.case_id));
    const nextId = getUnlockedCaseId(CASES, solvedIds);
    return nextId ? startCase(env, chatId, player, nextId) : sendMenu(env, chatId, "👑 همه پرونده‌های فعلی رو حل کردی!", "🎉");
  }
  if (text === "◀️ صفحه قبل" || text === "صفحه بعد ▶️") return showCases(env, chatId, player, text === "◀️ صفحه قبل" ? 1 : 2);'''
if needle not in s:
    raise SystemExit("cases handler not found")
s = s.replace(needle, replacement)

start = s.index('  if (activeCase) {')
end = s.index('\n  return sendMenu(env, chatId, "حاجی اینو نفهمیدم', start)
new_block = '''  if (activeCase) {
    const stage = getStage(activeCase, activeCase.current_step);
    const stageClues = getStageClues(activeCase, activeCase.current_step);
    const clueIndex = CLUE_LABELS.indexOf(text);
    if (clueIndex >= 0 && stageClues[clueIndex]) {
      return sendMessage(env, chatId, `🔍 مرحله ${activeCase.current_step + 1} — سرنخ ${clueIndex + 1}\\n\\n${stageClues[clueIndex]}\\n\\nاین جزئیات رو یادت بمونه؛ ممکنه در مرحله بعد معنی جدیدی پیدا کنه 👀`, caseKeyboard(activeCase, activeCase.current_step), 900, "🔍");
    }
    if (text === NEXT_STAGE && !isFinalStage(activeCase, activeCase.current_step)) {
      const nextStep = activeCase.current_step + 1;
      await env.DB.prepare("UPDATE player_progress SET current_step=?, updated_at=? WHERE player_id=? AND case_id=? AND solved=0").bind(nextStep, new Date().toISOString(), player.id, activeCase.id).run();
      const nextStage = getStage(activeCase, nextStep);
      if (isFinalStage(activeCase, nextStep)) return sendMessage(env, chatId, `🧩 مرحله نهایی\\n\\n${nextStage.question}\\n\\nحالا همه شواهد رو کنار هم بذار.`, puzzleKeyboard(nextStage), 1000, "🧩");
      return sendMessage(env, chatId, `🕵️ مرحله ${nextStep + 1}/${getStageCount(activeCase)} — ${nextStage.title}\\n\\nسرنخ‌های جدید رو بررسی کن.`, caseKeyboard(activeCase, nextStep), 900, "➡️");
    }
    if (text === PUZZLE_LABEL && isFinalStage(activeCase, activeCase.current_step)) {
      return sendMessage(env, chatId, `🧩 خب... رسیدیم به اصل ماجرا!\\n\\n${stage.question}\\n\\nفقط یکی از این جواب‌ها با شواهد جور درمیاد.`, puzzleKeyboard(stage), 950, "🧩");
    }
    if (text === "🔍 دیدن سرنخ‌ها") return startCase(env, chatId, player, activeCase.id);

    const finalCase = { ...activeCase, question: stage.question || activeCase.question, options: stage.options || activeCase.options, answer: stage.answer ?? activeCase.answer };
    const index = answerIndex(finalCase, text);
    if (index >= 0) {
      if (index !== finalCase.answer) return sendMessage(env, chatId, `❌ نه، این یکی با شواهد جور درنمیاد.\\n\\n${finalCase.question}\\n\\nیه بار دیگه همه شواهد رو مرور کن؛ عجله نکن کارآگاه 😉`, puzzleKeyboard(finalCase), 850, "🤔");
      try {
        const awarded = await awardCaseScore(env, message.from.id, player.id, activeCase.id);
        if (!awarded) return sendMenu(env, chatId, "✅ این پرونده قبلاً حل شده.\\n\\nبریم سراغ پرونده بعدی؟ 😎", "🏆");
        await unlockAchievements(env, player.id);
        const nextId = getUnlockedCaseId(CASES, new Set([...(await env.DB.prepare("SELECT case_id FROM player_progress WHERE player_id=? AND solved=1").bind(player.id).all()).results.map(r => r.case_id)]));
        const nextCase = getCase(nextId);
        const nextText = nextCase ? `\\n\\n➡️ پرونده بعدی: ${nextCase.title}\\nاز «پرونده قابل انجام» ادامه بده.` : "\\n\\n👑 تو هر ۶۰ پرونده رو پشت سر گذاشتی!";
        return sendMenu(env, chatId, `${activeCase.success}\\n\\n💰 +${activeCase.reward} امتیاز\\n\\n📁 پرونده ثبت شد.${nextText}`, "🎉");
      } catch (error) {
        logEvent("game_answer_error", { telegram_id: String(message.from.id), player_id: player.id, case_id: activeCase.id, message: error?.message || "unknown" });
        return sendMessage(env, chatId, "⚠️ جواب درست بود، ولی ثبت پرونده با مشکل روبه‌رو شد.\\n\\nچند لحظه بعد دوباره همین گزینه رو بزن. 👀", puzzleKeyboard(finalCase), 700, "⚠️");
      }
    }
  }'''
s = s[:start] + new_block + s[end:]
p.write_text(s, encoding="utf-8")
