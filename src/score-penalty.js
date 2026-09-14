export const MAX_CASE_MISTAKES = 3;

export function getScoreMultiplier(wrongGuesses = 0) {
  const mistakes = Math.max(0, Number(wrongGuesses) || 0);
  if (mistakes >= 3) return 0;
  return 1 / (2 ** mistakes);
}

export function calculateCaseScore(baseReward, wrongGuesses = 0) {
  const reward = Math.max(0, Number(baseReward) || 0);
  return Math.floor(reward * getScoreMultiplier(wrongGuesses));
}

export function getMistakeWarning(wrongGuesses = 0) {
  const mistakes = Math.max(0, Number(wrongGuesses) || 0);
  if (mistakes <= 0) return "⚠️ هشدار! در صورت پاسخ اشتباه، امتیاز این پرونده نصف خواهد شد!";
  if (mistakes === 1) return "⚠️ هشدار جدی! این دومین حدس توئه؛ اگر اشتباه کنی امتیاز پرونده به یک‌چهارم می‌رسه!";
  if (mistakes === 2) return "🚨 آخرین هشدار! اگر این حدس هم اشتباه باشه، امتیاز این پرونده کامل از بین می‌ره!";
  return "🚫 امتیاز این پرونده از بین رفته؛ ولی هنوز می‌تونی پرونده رو حل کنی.";
}

export async function recordCaseMistake(env, playerId, caseId) {
  const result = await env.DB.prepare(`
    UPDATE player_progress
    SET wrong_guesses = MIN(wrong_guesses + 1, ?), updated_at = ?
    WHERE player_id = ? AND case_id = ? AND solved = 0
  `).bind(MAX_CASE_MISTAKES, new Date().toISOString(), playerId, caseId).run();

  const progress = await env.DB.prepare(
    "SELECT wrong_guesses FROM player_progress WHERE player_id=? AND case_id=?"
  ).bind(playerId, caseId).first();

  return {
    recorded: Number(result?.meta?.changes || 0) > 0,
    wrongGuesses: Math.min(Number(progress?.wrong_guesses || 0), MAX_CASE_MISTAKES)
  };
}
