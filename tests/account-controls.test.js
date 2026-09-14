import test from "node:test";
import assert from "node:assert/strict";
import { buildAccountControls } from "../src/account-controls.js";

test("account controls expose reset and delete actions with confirmations", () => {
  const controls = buildAccountControls();
  assert.equal(controls.reset.button, "🔄 ری‌استارت حساب");
  assert.equal(controls.delete.button, "🗑️ حذف حساب");
  assert.equal(controls.reset.confirmation.includes("امتیاز"), true);
  assert.equal(controls.delete.confirmation.includes("پاک"), true);
  assert.equal(controls.reset.confirmationToken, "RESET_ACCOUNT");
  assert.equal(controls.delete.confirmationToken, "DELETE_ACCOUNT");
});

test("account reset preserves identity while clearing game state", () => {
  const sql = buildAccountControls().reset.sql;
  assert.match(sql, /DELETE FROM player_progress/);
  assert.match(sql, /DELETE FROM case_rewards/);
  assert.match(sql, /DELETE FROM player_achievements/);
  assert.match(sql, /DELETE FROM player_inventory/);
  assert.match(sql, /UPDATE players/);
  assert.match(sql, /score = 0/);
  assert.match(sql, /level = 1/);
});

test("account deletion removes the player record after dependent data", () => {
  const sql = buildAccountControls().delete.sql;
  assert.match(sql, /DELETE FROM player_progress/);
  assert.match(sql, /DELETE FROM case_rewards/);
  assert.match(sql, /DELETE FROM player_achievements/);
  assert.match(sql, /DELETE FROM player_inventory/);
  assert.match(sql, /DELETE FROM players/);
});
