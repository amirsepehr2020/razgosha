export const SAFE_ERROR_MESSAGE = "⚠️ مشکلی در پردازش درخواست پیش آمد. لطفاً چند لحظه بعد دوباره تلاش کن.";

export function shouldAwardCaseScore(progress) {
  return Number(progress?.solved || 0) === 0;
}

export function getSafeErrorMessage(_error) {
  return SAFE_ERROR_MESSAGE;
}

export function createRewardToken() {
  return crypto.randomUUID();
}
