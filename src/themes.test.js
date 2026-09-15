import test from "node:test";
import assert from "node:assert/strict";
import { THEME_MENU_LABEL, THEME_DOCUMENTS, getThemeMenuText } from "./themes.js";

test("theme menu exposes mobile and desktop downloads", () => {
  assert.equal(THEME_MENU_LABEL, "🎨 تم رازگشا");
  const text = getThemeMenuText();
  assert.match(text, /موبایل/);
  assert.match(text, /دسکتاپ/);
  assert.match(text, /Dark Detective Green/);
});

test("theme documents contain both Telegram theme files", () => {
  assert.deepEqual(Object.keys(THEME_DOCUMENTS).sort(), ["desktop", "mobile"]);
  assert.equal(THEME_DOCUMENTS.mobile.filename, "Razgosha-Dark-Detective.attheme");
  assert.equal(THEME_DOCUMENTS.desktop.filename, "Razgosha-Dark-Detective.tdesktop-theme");
  assert.match(THEME_DOCUMENTS.mobile.content, /#69E68A/);
  assert.match(THEME_DOCUMENTS.desktop.content, /#69E68A/);
});

test("theme menu keeps download actions distinct", () => {
  assert.notEqual(THEME_DOCUMENTS.mobile.filename, THEME_DOCUMENTS.desktop.filename);
});
