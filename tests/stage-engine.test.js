import test from "node:test";
import assert from "node:assert/strict";
import { buildStages, getStage, getStageCount, isFinalStage, getStageClues } from "../src/stage-engine.js";

test("stage engine creates a real three-step flow for legacy-shaped advanced cases", () => {
  const c = {
    clues: ["سرنخ ۱", "سرنخ ۲", "سرنخ ۳", "سرنخ ۴"],
    question: "معما؟",
    options: ["A", "B", "C", "D"],
    answer: 2
  };
  const stages = buildStages(c);
  assert.equal(stages.length, 3);
  assert.equal(stages[0].type, "clues");
  assert.equal(stages[1].type, "clues");
  assert.equal(stages[2].type, "puzzle");
  assert.equal(getStageCount(c), 3);
  assert.equal(getStage(c, 2).question, "معما؟");
  assert.equal(isFinalStage(c, 2), true);
  assert.deepEqual(getStageClues(c, 0), ["سرنخ ۱", "سرنخ ۲"]);
});

test("stage engine preserves explicitly authored stages", () => {
  const c = {
    stages: [
      { id: 1, type: "clues", clues: ["الف"] },
      { id: 2, type: "puzzle", question: "آخر؟", options: ["A", "B", "C", "D"], answer: 1 }
    ],
    clues: ["fallback"]
  };
  assert.equal(getStageCount(c), 2);
  assert.deepEqual(getStageClues(c, 0), ["الف"]);
  assert.equal(getStage(c, 1).answer, 1);
});
