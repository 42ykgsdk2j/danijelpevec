/**
 * Assessment scoring helpers. Mirrors the legacy calculateAssessmentResults
 * function: per-dimension score, overall score, profile band (A–E),
 * top 2 strengths, top 2 priorities.
 */
import dimensions from "../data/assessment-dimensions.json";
import questions from "../data/assessment-questions.json";

export type DimensionId = (typeof dimensions)[number]["id"];

export interface AssessmentResults {
  dimensions: Record<string, { score: number; max: number; pct: number }>;
  overall: { score: number; max: number; pct: number };
  profile: "A" | "B" | "C" | "D" | "E";
  strengths: string[];
  priorities: string[];
}

export function calculateAssessmentResults(
  answers: Record<string, number>,
): AssessmentResults {
  const dimScores: Record<string, { score: number; max: number; pct: number }> = {};
  for (const d of dimensions) {
    dimScores[d.id] = { score: 0, max: 0, pct: 0 };
  }

  for (const q of questions) {
    const ans = answers[q.id];
    if (typeof ans !== "number") continue;
    dimScores[q.dim].score += ans;
    dimScores[q.dim].max += 3;
  }

  for (const id of Object.keys(dimScores)) {
    const ds = dimScores[id];
    ds.pct = ds.max > 0 ? Math.round((ds.score / ds.max) * 100) : 0;
  }

  let totalScore = 0;
  let totalMax = 0;
  for (const ds of Object.values(dimScores)) {
    totalScore += ds.score;
    totalMax += ds.max;
  }
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  let profile: AssessmentResults["profile"] = "E";
  if (overallPct >= 80) profile = "A";
  else if (overallPct >= 60) profile = "B";
  else if (overallPct >= 40) profile = "C";
  else if (overallPct >= 20) profile = "D";

  const ranked = dimensions
    .map((d) => ({ id: d.id, pct: dimScores[d.id].pct }))
    .sort((a, b) => b.pct - a.pct);
  const strengths = ranked.slice(0, 2).map((r) => r.id);
  const priorities = ranked.slice(-2).reverse().map((r) => r.id);

  return {
    dimensions: dimScores,
    overall: { score: totalScore, max: totalMax, pct: overallPct },
    profile,
    strengths,
    priorities,
  };
}
