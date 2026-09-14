import { CASES as LEGACY_CASES } from "./cases.js";
import { ADVANCED_CASES } from "./advanced-cases.js";

export const CASES = [...LEGACY_CASES, ...ADVANCED_CASES];

export function getCase(id) {
  return CASES.find(c => c.id === id) || null;
}

export function getDifficultyStats() {
  return CASES.reduce((stats, c) => {
    stats[c.difficulty] = (stats[c.difficulty] || 0) + 1;
    return stats;
  }, {});
}
