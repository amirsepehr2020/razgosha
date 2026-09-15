import { readFileSync, writeFileSync } from "node:fs";

const path = "src/index.js";
let text = readFileSync(path, "utf8");
if (text.includes("// PAID_HINTS_SYSTEM")) {
  console.log("Paid hints already integrated.");
  process.exit(0);
}

text = text.replace(
  'import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";\n',
  'import { calculateCaseScore, getMistakeWarning, recordCaseMistake } from "./score-penalty.js";\nimport { getPaidHints, getPaidHintCost } from "./paid-hints.js";\n'
);
text = text.replace(
  'const NEXT_STAGE = "➡️ مرحله بعد";\n',
  'const NEXT_STAGE = "➡️ مرحله بعد";\nconst PAID_HINTS_LABEL = "💡 خرید سرنخ";\nconst PAID_HINT_PREFIX = "💡 خرید سرنخ ";\n'
);

const oldKeyboard = `  rows.push([isFinalStage(c, step) ? PUZZLE_LABEL : NEXT_STAGE]);
  rows.push([CASES_LABEL, BACK]);`;
const newKeyboard = `  rows.push([isFinalStage(c, step) ? PUZZLE_LABEL : NEXT_STAGE]);
  rows.push([PAID_HINTS_LABEL]);
  rows.push([CASES_LABEL, BACK]);`;
if (!text.includes(oldKeyboard)) throw new Error("caseKeyboard anchor not found");
text = text.replace(oldKeyboard, newKeyboard);

const helperAnchor = "function puzzleKeyboard(c) {";
const helpers = `// PAID_HINTS_SYSTEM
async function paidHintsState(env, player, caseId) {
  const rows = await env.DB.prepare("SELECT hint_index FROM identity_paid_hints WHERE telegram_id=? AND case_id=? ORDER BY hint_index").bind(String(player.telegram_id), caseId).all();
  return new Set(rows.results.map(r => Number(r.hint_index)));
}

function paidHintsKeyboard(hints, purchased) {
  const rows = [];
  for (let i = 0; i < hints.length; i++) {
    const cost = getPaidHintCost(i);
    rows.push([purchased.has(i) ? \`✅ سرنخ \${i + 1} — خریداری شده\` : \`💡 خرید سرنخ \${i + 1} — \${cost} امتیاز\`]);
  }
  rows.push([BACK]);
  return keyboard(rows, "سرنخ کمکی می‌خوای؟");
}

async function showPaidHints(env, chatId, player, activeCase) {
  const hints = getPaidHints(activeCase, activeCase.current_step);
  const purchased = await paidHintsState(env, player, activeCase.id);
  const balance = Number(player.score || 0);
  const lines = hints.map((hint, i) => purchased.has(i) ? hint : \`💡 سرنخ اضافه \${i + 1} — \${getPaidHintCost(i)} امتیاز\`);
  return sendMessage(env, chatId, \`💡 فروشگاه سرنخ\\n\\n💰 موجودی: \${balance} امتیاز\\n\\n\${lines.join("\\n")}\\n\\nاین سرنخ‌ها جدا از سرنخ‌های اصلی پرونده‌ان و فقط با امتیاز خریداری می‌شن.\`, paidHintsKeyboard(hints, purchased), 650, "💡");
}

async function buyPaidHint(env, chatId, player, activeCase, hintIndex) {
  const index = Number(hintIndex);
  const cost = getPaidHintCost(index);
  const hints = getPaidHints(activeCase, activeCase.current_step);
  if (cost === null || !hints[index]) return showPaidHints(env, chatId, player, activeCase);

  const existing = await env.DB.prepare("SELECT 1 FROM identity_paid_hints WHERE telegram_id=? AND case_id=? AND hint_index=?").bind(String(player.telegram_id), activeCase.id, index).first();
  if (existing) {
    const purchased = await paidHintsState(env, player, activeCase.id);
    return sendMessage(env, chatId, \`\${hints[index]}\\n\\nاین سرنخ رو قبلاً خریدی 😉\`, paidHintsKeyboard(hints, purchased), 700, "🔍");
  }

  const now = new Date().toISOString();
  const purchase = await env.DB.prepare("INSERT OR IGNORE INTO identity_paid_hints (telegram_id, case_id, hint_index, purchased_at) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM players WHERE id=? AND account_status='active')").bind(String(player.telegram_id), activeCase.id, index, now, player.id).run();
  if (Number(purchase?.meta?.changes || 0) !== 1) return showPaidHints(env, chatId, player, activeCase);

  const charged = await env.DB.prepare("UPDATE players SET score=score-?, updated_at=? WHERE id=? AND score>=? AND account_status='active'").bind(cost, now, player.id, cost).run();
  if (Number(charged?.meta?.changes || 0) !== 1) {
    await env.DB.prepare("DELETE FROM identity_paid_hints WHERE telegram_id=? AND case_id=? AND hint_index=?").bind(String(player.telegram_id), activeCase.id, index).run();
    return sendMessage(env, chatId, \`❌ امتیازت برای این سرنخ کافی نیست.\\n\\n💰 هزینه: \${cost}\\n🏆 موجودی: \${Number(player.score || 0)}\`, paidHintsKeyboard(hints, new Set()), 550, "💰");
  }

  const updatedPlayer = await findPlayer(env, player.telegram_id);
  const purchased = await paidHintsState(env, updatedPlayer, activeCase.id);
  logEvent("paid_hint_purchased", { telegram_id: String(player.telegram_id), player_id: player.id, case_id: activeCase.id, hint_index: index, cost });
  return sendMessage(env, chatId, \`✅ سرنخ خریداری شد!\\n\\n\${hints[index]}\\n\\n💸 -\${cost} امتیاز\\n💰 موجودی جدید: \${Number(updatedPlayer?.score || 0)} امتیاز\`, paidHintsKeyboard(hints, purchased), 800, "💡");
}

`;
if (!text.includes(helperAnchor)) throw new Error("puzzleKeyboard anchor not found");
text = text.replace(helperAnchor, helpers + helperAnchor);

const oldActive = `    const stage = getStage(activeCase, activeCase.current_step);
    const stageClues = getStageClues(activeCase, activeCase.current_step);`;
const newActive = `    const stage = getStage(activeCase, activeCase.current_step);
    if (text === PAID_HINTS_LABEL) return showPaidHints(env, chatId, player, activeCase);
    if (text.startsWith(PAID_HINT_PREFIX)) {
      const match = text.match(/^💡 خرید سرنخ (\\d+) — \\d+ امتیاز$/);
      if (match) return buyPaidHint(env, chatId, player, activeCase, Number(match[1]) - 1);
    }
    const stageClues = getStageClues(activeCase, activeCase.current_step);`;
if (!text.includes(oldActive)) throw new Error("active case anchor not found");
text = text.replace(oldActive, newActive);

writeFileSync(path, text);
console.log("Paid hint integration applied.");
