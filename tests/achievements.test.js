import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("achievement map covers progression and hidden milestones", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  for (const id of ["first-case", "three-cases", "five-cases", "ten-cases", "twenty-cases", "thirty-cases", "fifty-cases", "sixty-cases", "perfect-streak", "eagle-eye", "time-tracker", "mastermind", "impossible"]) {
    assert.match(source, new RegExp(`\\[\\"${id}\\"`));
  }
  assert.match(source, /🔒 بعض نشان‌ها شرایط مخفی دارن/);
});

test("achievement unlock logic keeps the major case milestones", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  for (const threshold of [10, 20, 30, 50, 60]) assert.match(source, new RegExp(`solved >= ${threshold}`));
});
