import test from "node:test";
import assert from "node:assert/strict";
import { calculateCaseScore, getMistakeWarning, getScoreMultiplier } from "../src/score-penalty.js";

test("case score multiplier follows 100/50/25/0 rule", () => {
  assert.equal(getScoreMultiplier(0), 1);
  assert.equal(getScoreMultiplier(1), 0.5);
  assert.equal(getScoreMultiplier(2), 0.25);
  assert.equal(getScoreMultiplier(3), 0);
  assert.equal(getScoreMultiplier(99), 0);
});

test("case score is reduced centrally", () => {
  assert.equal(calculateCaseScore(100, 0), 100);
  assert.equal(calculateCaseScore(100, 1), 50);
  assert.equal(calculateCaseScore(100, 2), 25);
  assert.equal(calculateCaseScore(100, 3), 0);
  assert.equal(calculateCaseScore(125, 1), 62);
});

test("warning escalates before each risky guess", () => {
  assert.match(getMistakeWarning(0), /نصف/);
  assert.match(getMistakeWarning(1), /یک‌چهارم/);
  assert.match(getMistakeWarning(2), /کامل از بین/);
});
