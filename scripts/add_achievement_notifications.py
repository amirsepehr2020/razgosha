from pathlib import Path

path = Path("src/index.js")
s = path.read_text(encoding="utf-8")

if "async function notifyNewAchievements(env, chatId, achievementIds)" not in s:
    marker = "\nfunction caseFromButton(text) {"
    notification = '''\nasync function notifyNewAchievements(env, chatId, achievementIds) {\n  if (!Array.isArray(achievementIds) || achievementIds.length === 0) return;\n  const names = new Map(ACHIEVEMENTS.map(([id, name]) => [id, name]));\n  const lines = achievementIds\n    .map(id => names.get(id))\n    .filter(Boolean)\n    .map(name => `🏅 ${name}`);\n  if (!lines.length) return;\n  try {\n    await sendMessage(\n      env,\n      chatId,\n      `🎉 دستاورد جدید!\\n\\n${lines.join("\\n")}\\n\\nآفرین کارآگاه! این نشان برای همیشه توی پروفایلت ثبت شد 🔥`,\n      MENU,\n      350,\n      "🏅"\n    );\n  } catch (error) {\n    logEvent("achievement_notification_error", { chat_id: chatId, achievement_ids: achievementIds, message: error?.message || "unknown" });\n  }\n}\n'''
    if marker not in s:
        raise SystemExit("achievement notification insertion marker not found")
    s = s.replace(marker, notification + marker, 1)

old = "            await unlockAchievements(env, player.id);"
new = "            const newlyUnlocked = await unlockAchievements(env, player.id);\n            await notifyNewAchievements(env, chatId, newlyUnlocked);"
if old not in s:
    if "await notifyNewAchievements(env, chatId, newlyUnlocked);" not in s:
        raise SystemExit("achievement unlock call site not found")
else:
    s = s.replace(old, new, 1)

path.write_text(s, encoding="utf-8")
print("achievement notifications integrated")
