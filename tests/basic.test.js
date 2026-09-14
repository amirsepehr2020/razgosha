import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("worker entry exists", () => {
  assert.equal(fs.existsSync("src/index.js"), true);
});

test("D1 migration contains required tables", () => {
  const sql = fs.readFileSync("migrations/0001_initial.sql", "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS players/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS player_progress/);
});
