export function buildStages(caseData) {
  if (Array.isArray(caseData?.stages) && caseData.stages.length) return caseData.stages;

  const clues = Array.isArray(caseData?.clues) ? caseData.clues : [];
  const midpoint = Math.max(1, Math.ceil(clues.length / 2));
  const first = clues.slice(0, midpoint);
  const second = clues.slice(midpoint);
  const stages = [
    { id: 1, title: "جمع‌آوری شواهد", clues: first, type: "clues" },
    { id: 2, title: "بررسی تناقض", clues: second, type: "clues" },
    {
      id: 3,
      title: "معمای نهایی",
      clues: [],
      type: "puzzle",
      question: caseData?.question,
      options: caseData?.options,
      answer: caseData?.answer
    }
  ];
  return stages.filter(stage => stage.type === "puzzle" || stage.clues.length);
}

export function getStage(caseData, step = 0) {
  const stages = buildStages(caseData);
  const index = Math.max(0, Math.min(Number(step) || 0, stages.length - 1));
  return stages[index] || null;
}

export function getStageCount(caseData) {
  return buildStages(caseData).length;
}

export function isFinalStage(caseData, step = 0) {
  return (Number(step) || 0) >= getStageCount(caseData) - 1;
}

export function getStageClues(caseData, step = 0) {
  return getStage(caseData, step)?.clues || [];
}
