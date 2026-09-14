import test from "node:test";
import assert from "node:assert/strict";
import { CASES, getCase, getDifficultyStats } from "../src/case-catalog.js";

test("case catalog exposes all 60 detective cases", () => {
  assert.equal(CASES.length, 60);
  assert.equal(getCase("case-001")?.id, "case-001");
  assert.equal(getCase("case-060")?.id, "case-060");
  assert.equal(CASES.filter(c => c.advanced).length, 50);
});

test("60-case catalog keeps the actual difficulty distribution", () => {
  assert.deepEqual(getDifficultyStats(), {
    "آسان": 7,
    "متوسط": 13,
    "سخت": 13,
    "خیلی سخت": 12,
    "نابغه": 5,
    "ویژه": 10
  });
});
