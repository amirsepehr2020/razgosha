import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "src/index.js");
const outputPath = path.join(root, "src/themes.js");
const mobilePath = path.join(root, "themes/Razgosha-Dark-Detective.attheme");
const desktopPath = path.join(root, "themes/Razgosha-Dark-Detective.tdesktop-theme");

const mobile = fs.readFileSync(mobilePath, "utf8");
const desktop = fs.readFileSync(desktopPath, "utf8");

const generated = `export const THEME_MENU_LABEL = "🎨 تم رازگشا";

export const THEME_DOCUMENTS = ${JSON.stringify({
  mobile: { filename: "Razgosha-Dark-Detective.attheme", contentType: "text/plain", content: mobile },
  desktop: { filename: "Razgosha-Dark-Detective.tdesktop-theme", contentType: "text/plain", content: desktop }
}, null, 2)};

export function getThemeMenuText() {
  return \`🎨 تم اختصاصی رازگشا — Dark Detective Green\\n\\n🌑 فضای تاریک و مرموز با Accent سبز کارآگاهی.\\n\\n📱 نسخه موبایل و 🖥️ نسخه دسکتاپ آماده‌ان.\\n\\nیکی رو انتخاب کن تا فایل تم رو مستقیم از خود رازگشا بگیری. 🕵️‍♂️\`;
}

export async function sendThemeDocument(env, chatId, kind, caption) {
  const document = THEME_DOCUMENTS[kind];
  if (!document) throw new Error(\`Unknown theme: \${kind}\`);

  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("document", new Blob([document.content], { type: document.contentType }), document.filename);
  form.append("caption", caption);

  const response = await fetch(\`https://api.telegram.org/bot\${env.BOT_TOKEN}/sendDocument\`, {
    method: "POST",
    body: form
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || "theme upload failed");
  return result;
}
`;

fs.writeFileSync(outputPath, generated);

let source = fs.readFileSync(indexPath, "utf8");
const importLine = 'import { THEME_MENU_LABEL, getThemeMenuText, sendThemeDocument } from "./themes.js";';
if (!source.includes(importLine)) {
  const anchor = 'import { buildAccountControls } from "./account-controls.js";';
  if (!source.includes(anchor)) throw new Error("Theme integration anchor import not found");
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

const menuAnchor = '    [{ text: "🏅 دستاوردها" }, { text: "🎒 کوله‌باز" }],';
if (!source.includes('    [{ text: THEME_MENU_LABEL }],')) {
  if (!source.includes(menuAnchor)) throw new Error("Theme menu anchor not found");
  source = source.replace(menuAnchor, `${menuAnchor}\n    [{ text: THEME_MENU_LABEL }],`);
}

const handlerMarker = 'if (text === HELP_LABEL)';
const handler = `if (text === THEME_MENU_LABEL) {
      await telegram(env, "sendMessage", {
        chat_id: message.chat.id,
        text: getThemeMenuText(),
        reply_markup: {
          keyboard: [
            [{ text: "📱 دانلود تم موبایل" }],
            [{ text: "🖥️ دانلود تم دسکتاپ" }],
            [{ text: BACK }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      });
      return;
    }

    if (text === "📱 دانلود تم موبایل") {
      await sendThemeDocument(env, message.chat.id, "mobile", "📱 تم Dark Detective Green رازگشا برای موبایل\\n\\nفایل رو باز کن و در تلگرام اعمالش کن. 🟢🕵️‍♂️");
      return;
    }

    if (text === "🖥️ دانلود تم دسکتاپ") {
      await sendThemeDocument(env, message.chat.id, "desktop", "🖥️ تم Dark Detective Green رازگشا برای دسکتاپ\\n\\nفایل رو باز کن و در تنظیمات ظاهر تلگرام اعمالش کن. 🟢🕵️‍♂️");
      return;
    }

    `;

if (!source.includes('if (text === THEME_MENU_LABEL)')) {
  const markerIndex = source.indexOf(handlerMarker);
  if (markerIndex === -1) throw new Error("Theme handler insertion marker not found");
  source = source.slice(0, markerIndex) + handler + source.slice(markerIndex);
}

fs.writeFileSync(indexPath, source);
console.log("Razgosha Telegram themes integrated.");
