import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CASES } from "../src/cases.js";
import { CASES_PER_PAGE, getCasePage, getUnlockedCaseId } from "../src/case-pagination.js";

test("case archive is paginated into 10 cases per page", () => {
  assert.equal(CASES_PER_PAGE, 10);
  const first = getCasePage(CASES, 1);
  const sixth = getCasePage(CASES, 6);
  assert.equal(first.items.length, 10);
  assert.equal(sixth.items.length, 10);
  assert.equal(first.items[0].id, "case-001");
  assert.equal(sixth.items[0].id, "case-051");
  assert.equal(first.totalPages, 6);
});

test("case archive clamps invalid pages", () => {
  assert.equal(getCasePage(CASES, 0).page, 1);
  assert.equal(getCasePage(CASES, 99).page, 6);
});

test("next unlocked case is the first unsolved case in sequence", () => {
  assert.equal(getUnlockedCaseId(CASES, new Set()), "case-001");
  assert.equal(getUnlockedCaseId(CASES, new Set(["case-001"])), "case-002");
  assert.equal(getUnlockedCaseId(CASES, new Set(["case-001", "case-002"])), "case-003");
});

test("index uses compact archive controls instead of 60 case buttons", () => {
  const source = fs.readFileSync("src/index.js", "utf8");
  assert.match(source, /getCasePage/);
  assert.match(source, /صفحه \$\{currentPage \+ 1\}/);
  assert.match(source, /صفحه \$\{currentPage - 1\}/);
  assert.match(source, /پرونده بعدی/);
});
