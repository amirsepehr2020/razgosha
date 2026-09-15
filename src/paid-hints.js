const COSTS = [10, 20, 35];

export function getPaidHintCosts() {
  return [...COSTS];
}

function focusFor(question = "") {
  const q = String(question);
  if (/زمان|ساعت|دقیقه|تاریخ|بازه|timeline|زمانی/i.test(q)) return "زمان و ترتیب اتفاق‌ها";
  if (/چه کسی|کی |مظنون|شخص|فرد|قاتل|عامل/i.test(q)) return "ارتباط بین افراد و مظنون‌ها";
  if (/کجا|محل|اتاق|مکان|ورودی|خروجی/i.test(q)) return "جزئیات مربوط به مکان";
  if (/کدام|کدوم|کدام گزینه|کدوم گزینه/i.test(q)) return "بخشی از شواهد که مستقیم به سؤال جواب می‌دهد";
  return "رابطه‌ی بین شواهد و سؤال نهایی";
}

export function getPaidHints(c, step = 0) {
  const stage = Array.isArray(c?.stages) ? c.stages[step] : null;
  const question = stage?.question || c?.question || "";
  const focus = focusFor(question);
  return [
    `💡 سرنخ اضافه ۱: فعلاً روی ${focus} تمرکز کن؛ جزئیات فرعی رو کنار بذار.`,
    `💡 سرنخ اضافه ۲: گزینه‌هایی که با ${focus} ارتباط مستقیمی ندارن، احتمالاً ارزش بررسی کمتری دارن.`,
    `💡 سرنخ اضافه ۳: بین گزینه‌های باقی‌مونده، دنبال پاسخی باش که مستقیم‌ترین ارتباط منطقی رو با ${focus} داشته باشه.`
  ];
}

export function getPaidHintCost(index) {
  return COSTS[index] ?? null;
}
