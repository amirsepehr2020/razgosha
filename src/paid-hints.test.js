import test from "node:test";
import assert from "node:assert/strict";
import { getPaidHintCosts, getPaidHints, getPaidHintCost } from "./paid-hints.js";

test("paid hints have the agreed 10/20/35 score prices", () => {
  assert.deepEqual(getPaidHintCosts(), [10, 20, 35]);
  assert.equal(getPaidHintCost(0), 10);
  assert.equal(getPaidHintCost(1), 20);
  assert.equal(getPaidHintCost(2), 35);
  assert.equal(getPaidHintCost(3), null);
});

test("paid hints are separate generated hints and exist for every case shape", () => {
  const c = { question: "کدوم بازه زمانی مهم‌تره؟", clues: ["default clue"] };
  const hints = getPaidHints(c, 0);
  assert.equal(hints.length, 3);
  assert.ok(hints.every((hint) => hint.includes("سرنخ اضافه")));
  assert.ok(hints.every((hint) => !hint.includes("default clue")));
});

test("stage question changes the purchased hint focus", () => {
  const c = { question: "کدوم گزینه؟", stages: [{ question: "چه کسی مظنون اصلیه؟" }] };
  assert.match(getPaidHints(c, 0)[0], /افراد و مظنون‌ها/);
});
