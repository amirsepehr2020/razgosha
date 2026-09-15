export const ACCOUNT_CONTROLS = Object.freeze({
  reset: {
    button: "🔄 ری‌استارت حساب",
    confirmationToken: "RESET_ACCOUNT",
    confirmation: "🔄 مطمئنی می‌خوای اکانتت رو ری‌استارت کنی؟\n\nامتیاز و وضعیت پروفایلت از نو شروع می‌شن؛ اما سابقه پرونده‌ها، اشتباه‌ها و دستاوردهای ثبت‌شده برای جلوگیری از تقلب حفظ می‌شن."
  },
  delete: {
    button: "🗑️ حذف حساب",
    confirmationToken: "DELETE_ACCOUNT",
    confirmation: "🗑️ حساب قابل حذف شدنه، ولی سابقه ضدتقلب بازی پاک نمی‌شه.\n\nبا تأیید، حساب فعلی و اطلاعات نمایشی‌اش پاک می‌شن؛ اما سابقه پرونده‌ها، اشتباه‌ها، دستاوردها و جوایز دریافت‌شده برای جلوگیری از دور زدن سیستم حفظ می‌شن. با /start می‌تونی دوباره حسابت رو بسازی."
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
