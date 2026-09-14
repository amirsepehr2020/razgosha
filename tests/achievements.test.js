import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const IDS = [
  "first-case", "clue-tracker", "three-cases", "puzzle-solver", "five-cases",
  "ten-cases", "twenty-cases", "thirty-cases", "fifty-cases", "sixty-cases",
  "perfect-streak", "eagle-eye", "time-tracker", "mastermind", "impossible"
];

test("achievement map covers all progression and hidden milestones", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  for (const id of IDS) assert.match(source, new RegExp(`\\[\\"${id}\\"`));
  assert.match(source, /🔒 بعض نشان‌ها شرایط مخفی دارن/);
});

test("achievement unlock logic keeps the major case milestones", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  for (const threshold of [10, 20, 30, 50, 60]) assert.match(source, new RegExp(`solved >= ${threshold}`));
});

test("achievement integration is wired to persistent player achievements", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /player_achievements/);
  assert.match(source, /INSERT OR IGNORE INTO player_achievements/);
  assert.match(source, /unlockAchievements\\(env, player\\.id\\)/);
});
