import fs from "node:fs";

const path = "src/index.js";
let source = fs.readFileSync(path, "utf8");

if (!source.includes('from "./start-experience.js"')) {
  const anchor = 'import { LEADERBOARD_TYPES, rankLeaderboard } from "./leaderboard.js";\n';
  if (!source.includes(anchor)) throw new Error("start experience import anchor not found");
  source = source.replace(anchor, anchor + 'import { getStartExperience, FEATURED_CASES_LABEL } from "./start-experience.js";\n');
}

if (!source.includes("FEATURED_CASES_LABEL")) throw new Error("start experience import was not integrated");

const menuOld = '    [{ text: "🔎 پرونده‌ها" }, { text: "🎯 مأموریت امروز" }],';
const menuNew = '    [{ text: FEATURED_CASES_LABEL }],\n    [{ text: "🎯 مأموریت امروز" }, { text: "👤 پروفایل" }],';
if (source.includes(menuOld)) source = source.replace(menuOld, menuNew);

// Normalize the menu after the first-start integration so repeated workflow runs
// never leave duplicate profile buttons behind.
const duplicateProfileMenu = `${menuNew}\n    [{ text: "👤 پروفایل" }, { text: "🏆 رتبه‌بندی" }],`;
const normalizedMenu = `${menuNew}\n    [{ text: "🏆 رتبه‌بندی" }],`;
if (source.includes(duplicateProfileMenu)) source = source.replace(duplicateProfileMenu, normalizedMenu);

const startOld = `  if (text === "/start") {\n    const player = await createAccount(env, message.from);\n    return sendMenu(env, chatId, \`🕵️ سلام \${esc(player.detective_name || player.first_name)}!\\n\\nحساب کارآگاهی‌ات ساخته شد و از اینجا به بعد همه‌چی برای خودته.\\n\\nده‌ها پرونده منتظرتـه؛ بریم ببینیم چندتاشو می‌تونی حل کنی 😎🔥\`, "🎉");\n  }`;
const startNew = `  if (text === "/start") {\n    const existing = await findPlayer(env, message.from.id);\n    const identity = await env.DB.prepare("SELECT 1 FROM player_identities WHERE telegram_id=? LIMIT 1").bind(String(message.from.id)).first();\n    const isFirstStart = !existing && !identity;\n    const player = await createAccount(env, message.from);\n    const experience = getStartExperience(isFirstStart, esc(player.detective_name || player.first_name || "کارآگاه"));\n    return sendMenu(env, chatId, experience.text, "🎉");\n  }`;
if (source.includes(startOld)) source = source.replace(startOld, startNew);

const casesHandlerOld = 'if (text === "/cases" || text === "🔎 پرونده‌ها" || text === CASES_LABEL) return showCases(env, chatId, player, 1);';
const casesHandlerNew = 'if (text === "/cases" || text === "🔎 پرونده‌ها" || text === FEATURED_CASES_LABEL || text === CASES_LABEL) return showCases(env, chatId, player, 1);';
if (source.includes(casesHandlerOld)) source = source.replace(casesHandlerOld, casesHandlerNew);

fs.writeFileSync(path, source);
console.log("Start experience integrated.");
