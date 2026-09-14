export const ACCOUNT_CONTROLS = Object.freeze({
  reset: {
    button: "🔄 ری‌استارت حساب",
    confirmationToken: "RESET_ACCOUNT",
    confirmation: "🔄 مطمئنی می‌خوای اکانتت رو ری‌استارت کنی؟\n\nامتیاز، مرحله، پیشرفت پرونده‌ها، دستاوردها، آیتم‌ها و استریکت صفر می‌شن؛ ولی خود حساب و هویتت باقی می‌مونه."
  },
  delete: {
    button: "🗑️ حذف حساب",
    confirmationToken: "DELETE_ACCOUNT",
    confirmation: "🗑️ حذف حساب دائمیه.\n\nبا تأیید، اطلاعات حساب و تمام پیشرفت بازی پاک می‌شن و برای شروع دوباره باید دوباره حساب بسازی."
  }
});

export function buildAccountControls() {
  return {
    reset: {
      ...ACCOUNT_CONTROLS.reset,
      sql: `
BEGIN TRANSACTION;
DELETE FROM player_progress WHERE player_id = ?;
DELETE FROM case_rewards WHERE player_id = ?;
DELETE FROM player_achievements WHERE player_id = ?;
DELETE FROM player_inventory WHERE player_id = ?;
UPDATE players
SET score = 0,
    level = 1,
    streak = 0,
    last_daily_claim = NULL,
    clues_viewed = 0,
    puzzles_solved = 0,
    perfect_streak = 0,
    account_status = 'active',
    updated_at = ?
WHERE id = ?;
COMMIT;`
    },
    delete: {
      ...ACCOUNT_CONTROLS.delete,
      sql: `
BEGIN TRANSACTION;
DELETE FROM player_progress WHERE player_id = ?;
DELETE FROM case_rewards WHERE player_id = ?;
DELETE FROM player_achievements WHERE player_id = ?;
DELETE FROM player_inventory WHERE player_id = ?;
DELETE FROM players WHERE id = ?;
COMMIT;`
    }
  };
}
