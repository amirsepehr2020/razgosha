import test from "node:test";
import assert from "node:assert/strict";
import { shouldAwardCaseScore, getSafeErrorMessage } from "../src/game-guards.js";

test("case score is awarded only when the case is not already solved", () => {
  assert.equal(shouldAwardCaseScore({ solved: 0 }), true);
  assert.equal(shouldAwardCaseScore({ solved: 1 }), false);
});

test("internal errors are converted to a safe Persian user message", () => {
  assert.equal(
    getSafeErrorMessage(new Error("SQLITE secret details")),
    "⚠️ مشکلی در پردازش درخواست پیش آمد. لطفاً چند لحظه بعد دوباره تلاش کن."
  );
});
