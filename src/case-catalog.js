import { CASES } from "./cases.js";

export { CASES };

export function getCase(id) {
  return CASES.find(c => c.id === id) || null;
}

export function getDifficultyStats() {
  return CASES.reduce((stats, c) => {
    stats[c.difficulty] = (stats[c.difficulty] || 0) + 1;
    return stats;
  }, {});
}
