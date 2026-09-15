import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getStartExperience, FEATURED_CASES_LABEL } from "./start-experience.js";

test("first start clearly directs a new player to پرونده‌ها", () => {
  const experience = getStartExperience(true, "سپهر");
  assert.equal(experience.showOnboarding, true);
  assert.match(experience.text, /اول از همه/);
  assert.match(experience.text, /پرونده/);
  assert.match(experience.text, /امتیاز/);
  assert.equal(experience.buttonLabel, FEATURED_CASES_LABEL);
});

test("returning players do not get the first-start onboarding", () => {
  const experience = getStartExperience(false, "سپهر");
  assert.equal(experience.showOnboarding, false);
  assert.equal(experience.buttonLabel, FEATURED_CASES_LABEL);
  assert.doesNotMatch(experience.text, /اول از همه/);
});

test("featured cases label is a dedicated, visually prominent menu action", () => {
  assert.match(FEATURED_CASES_LABEL, /🔥/);
  assert.match(FEATURED_CASES_LABEL, /پرونده‌ها/);
});

test("main menu contains exactly one profile button", () => {
  const source = fs.readFileSync(new URL("./index.js", import.meta.url), "utf8");
  const profileButtons = source.match(/\{ text: "👤 پروفایل" \}/g) ?? [];
  assert.equal(profileButtons.length, 1);
});
