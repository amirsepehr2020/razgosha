import test from "node:test";
import assert from "node:assert/strict";
import { calculateAccuracy, rankLeaderboard } from "./leaderboard.js";

test("accuracy is solved answers divided by solved plus mistakes", () => {
  assert.equal(calculateAccuracy(8, 2), 80);
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateAccuracy(3, 0), 100);
});

test("leaderboard ranks by metric and keeps the current player position", () => {
  const rows = [
    { telegram_id: "1", score: 120, solved: 4, wrong_guesses: 1, streak: 3 },
    { telegram_id: "2", score: 200, solved: 3, wrong_guesses: 0, streak: 7 },
    { telegram_id: "3", score: 90, solved: 6, wrong_guesses: 2, streak: 4 }
  ];

  const result = rankLeaderboard(rows, "score", "3", 2);
  assert.deepEqual(result.top.map(r => r.telegram_id), ["2", "1"]);
  assert.equal(result.current.rank, 3);
});

test("accuracy ranking excludes players with no attempts", () => {
  const rows = [
    { telegram_id: "1", solved: 0, wrong_guesses: 0 },
    { telegram_id: "2", solved: 5, wrong_guesses: 1 },
    { telegram_id: "3", solved: 4, wrong_guesses: 0 }
  ];
  const result = rankLeaderboard(rows, "accuracy", "1", 10);
  assert.deepEqual(result.top.map(r => r.telegram_id), ["3", "2"]);
});
