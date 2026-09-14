export const CASES_PER_PAGE = 10;

export function getCasePage(cases, page = 1) {
  const totalPages = Math.max(1, Math.ceil(cases.length / CASES_PER_PAGE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * CASES_PER_PAGE;
  return {
    page: safePage,
    totalPages,
    items: cases.slice(start, start + CASES_PER_PAGE)
  };
}

export function getUnlockedCaseId(cases, solvedIds) {
  const solved = solvedIds instanceof Set ? solvedIds : new Set(solvedIds || []);
  const index = cases.findIndex((c, i) => i === 0 || solved.has(cases[i - 1]?.id));
  return index >= 0 ? cases[index]?.id || null : null;
}
