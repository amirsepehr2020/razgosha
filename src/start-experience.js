export const FEATURED_CASES_LABEL = "🔥 🔎 پرونده‌ها — شروع بازی";

export function getStartExperience(isFirstStart, name = "کارآگاه") {
  if (isFirstStart) {
    return {
      showOnboarding: true,
      buttonLabel: FEATURED_CASES_LABEL,
      text: `🕵️ سلام ${name}!\n\nحساب کارآگاهی‌ات ساخته شد 🎉\n\n🚨 اول از همه روی «${FEATURED_CASES_LABEL}» بزن؛ اینجا بخش اصلی رازگشاست و از حل پرونده‌ها امتیاز می‌گیری.\n\n🔎 سرنخ‌ها رو بررسی کن، معما رو حل کن و امتیازت رو بالا ببر.\n\nبزن بریم کارآگاه! 😎🔥`
    };
  }

  return {
    showOnboarding: false,
    buttonLabel: FEATURED_CASES_LABEL,
    text: `🕵️ سلام دوباره ${name}!\n\nپرونده بعدی منتظرته؛ بزن بریم 😎🔥`
  };
}
