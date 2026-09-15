import fs from "node:fs";

const path = "src/index.js";
let source = fs.readFileSync(path, "utf8");

if (!source.includes('from "./leaderboard.js"')) {
  source = source.replace(
    'import { getPaidHints, getPaidHintCost } from "./paid-hints.js";\n',
    'import { getPaidHints, getPaidHintCost } from "./paid-hints.js";\nimport { LEADERBOARD_TYPES, rankLeaderboard } from "./leaderboard.js";\n'
  );
}

const rankBlock = /async function rank\(env, chatId\) \{[\s\S]*?\n\}\n\nasync function achievements/;
if (rankBlock.test(source)) {
  const replacement = `async function leaderboardRows(env) {
  const result = await env.DB.prepare(
    "SELECT p.telegram_id, p.first_name, p.detective_name, p.score, p.streak, p.best_streak, COALESCE(SUM(CASE WHEN pp.solved=1 THEN 1 ELSE 0 END), 0) AS solved, COALESCE(SUM(CASE WHEN pp.solved=1 THEN 0 ELSE pp.wrong_guesses END), 0) AS wrong_guesses FROM players p LEFT JOIN player_progress pp ON pp.player_id=p.id WHERE p.account_status='active' GROUP BY p.id"
  ).all();
  return result.results || [];
}

function leaderboardKeyboard() {
  return keyboard([
    [LEADERBOARD_TYPES[0][1], LEADERBOARD_TYPES[1][1]],
    [LEADERBOARD_TYPES[2][1], LEADERBOARD_TYPES[3][1]],
    [BACK]
  ], "نوع رتبه‌بندی...");
}

function leaderboardValueText(metric, row) {
  if (metric === "accuracy") return \`🎯 \${row.value}% دقت\`;
  if (metric === "solved") return \`🧠 \${row.value} پرونده\`;
  if (metric === "streak") return \`🔥 \${row.value} روز\`;
  return \`🏆 \${row.value} امتیاز\`;
}

async function rank(env, chatId, player, metric = "score") {
  const rows = await leaderboardRows(env);
  const result = rankLeaderboard(rows, metric, String(player?.telegram_id || ""), 10);
  const meta = LEADERBOARD_TYPES.find(x => x[0] === metric) || LEADERBOARD_TYPES[0];
  const medals = ["🥇", "🥈", "🥉"];
  const lines = result.top.map((p, i) => \`\${medals[i] || \`#\${p.rank}\`} \${esc(p.detective_name || p.first_name || "کارآگاه")} — \${leaderboardValueText(metric, p)}\`).join("\\n") || "هنوز رکوردی ثبت نشده.";
  const me = result.current;
  const myLine = me && me.rank > 10 ? \`\\n\\n📍 رتبه تو: #\${me.rank} — \${leaderboardValueText(metric, me)}\` : me ? \`\\n\\n📍 رتبه تو: #\${me.rank}\` : "";
  return sendMessage(env, chatId, \`👑 لیدربورد رازگشا\\n\\n\${meta[1]}\\n\\n\${lines}\${myLine}\\n\\n🔥 رقابت ادامه داره؛ جای تو بین بهترین‌ها خالیه!\`, leaderboardKeyboard(), 700, "🏆");
}

async function achievements`;
  source = source.replace(rankBlock, replacement);
}

const dailyOld = 'await env.DB.prepare("UPDATE players SET score=?, streak=?, last_daily_claim=?, updated_at=? WHERE id=?").bind(newScore, newStreak, today, new Date().toISOString(), player.id).run();';
const dailyNew = 'await env.DB.prepare("UPDATE players SET score=?, streak=?, best_streak=MAX(best_streak, ?), last_daily_claim=?, updated_at=? WHERE id=?").bind(newScore, newStreak, newStreak, today, new Date().toISOString(), player.id).run();';
source = source.replace(dailyOld, dailyNew);

if (!source.includes('const LEADERBOARD_METRICS =')) {
  const anchor = 'const PAID_HINT_PREFIX = "💡 خرید سرنخ ";\n';
  if (!source.includes(anchor)) throw new Error("leaderboard constants anchor not found");
  source = source.replace(anchor, anchor + 'const LEADERBOARD_METRICS = Object.fromEntries(LEADERBOARD_TYPES.map(([id, label]) => [label, id]));\n');
}

if (!source.includes('LEADERBOARD_METRICS[text]')) {
  const anchor = 'if (text === "/rank" || text === "🏆 رتبه‌بندی") return rank(env, chatId);';
  if (!source.includes(anchor)) throw new Error("leaderboard handler anchor not found");
  source = source.replace(anchor, 'if (text === "/rank" || text === "🏆 رتبه‌بندی") return rank(env, chatId, player, "score");\n  if (LEADERBOARD_METRICS[text]) return rank(env, chatId, player, LEADERBOARD_METRICS[text]);');
}

fs.writeFileSync(path, source);
console.log("Leaderboard integrated.");
