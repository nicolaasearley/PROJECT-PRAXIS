export type ReadinessCategory = 'low' | 'moderate' | 'high';

export interface ReadinessAnalysis {
  score: number; // 0-100
  category: ReadinessCategory;
}

/**
 * Analyze weekly readiness based on recovery score
 * Returns readiness score (0-100) and category
 */
export function analyzeReadiness(recoveryScore: number | null): ReadinessAnalysis {

  // If no recovery score, default to moderate
  if (recoveryScore === null) {
    return {
      score: 50,
      category: 'moderate',
    };
  }

  // Categorize based on recovery score
  let category: ReadinessCategory;
  if (recoveryScore < 40) {
    category = 'low';
  } else if (recoveryScore >= 40 && recoveryScore < 70) {
    category = 'moderate';
  } else {
    category = 'high';
  }

  return {
    score: recoveryScore,
    category,
  };
}
