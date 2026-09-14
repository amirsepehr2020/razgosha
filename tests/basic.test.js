import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("worker entry exists", () => {
  assert.equal(fs.existsSync("src/index.js"), true);
});

test("D1 migrations contain required tables", () => {
  const initial = fs.readFileSync("migrations/0001_initial.sql", "utf8");
  const rewards = fs.readFileSync("migrations/0002_case_rewards.sql", "utf8");
  assert.match(initial, /CREATE TABLE IF NOT EXISTS players/);
  assert.match(initial, /CREATE TABLE IF NOT EXISTS player_progress/);
  assert.match(rewards, /CREATE TABLE IF NOT EXISTS case_rewards/);
  assert.match(rewards, /UNIQUE\(player_id, case_id\)/);
});
