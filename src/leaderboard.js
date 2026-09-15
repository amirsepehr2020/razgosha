export const LEADERBOARD_TYPES = [
  ["score", "🏆 بیشترین امتیاز", "امتیاز"],
  ["solved", "🧠 بیشترین پرونده حل‌شده", "پرونده"],
  ["accuracy", "🎯 بالاترین دقت", "دقت"],
  ["streak", "🔥 طولانی‌ترین Streak", "روز"]
];

export function calculateAccuracy(solved, wrongGuesses) {
  const correct = Math.max(0, Number(solved || 0));
  const wrong = Math.max(0, Number(wrongGuesses || 0));
  const attempts = correct + wrong;
  if (!attempts) return 0;
  return Math.round((correct / attempts) * 1000) / 10;
}

function valueFor(row, metric) {
  if (metric === "accuracy") return calculateAccuracy(row.solved, row.wrong_guesses);
  if (metric === "solved") return Number(row.solved || 0);
  if (metric === "streak") return Number(row.best_streak ?? row.streak ?? 0);
  return Number(row.score || 0);
}

export function rankLeaderboard(rows, metric, currentTelegramId = null, limit = 10) {
  const eligible = rows.filter(row => metric !== "accuracy" || Number(row.solved || 0) + Number(row.wrong_guesses || 0) > 0);
  const sorted = [...eligible].sort((a, b) => {
    const valueDiff = valueFor(b, metric) - valueFor(a, metric);
    if (valueDiff) return valueDiff;
    const solvedDiff = Number(b.solved || 0) - Number(a.solved || 0);
    if (solvedDiff) return solvedDiff;
    return String(a.telegram_id).localeCompare(String(b.telegram_id));
  });
  const ranked = sorted.map((row, index) => ({ ...row, rank: index + 1, value: valueFor(row, metric) }));
  return {
    top: ranked.slice(0, limit),
    current: ranked.find(row => String(row.telegram_id) === String(currentTelegramId)) || null
  };
}
