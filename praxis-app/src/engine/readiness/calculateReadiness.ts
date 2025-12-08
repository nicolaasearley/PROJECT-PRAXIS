/**
 * Readiness Scoring Engine
 *
 * Calculates a readiness score (0-100) based on daily inputs:
 * - Sleep Quality (1-5)
 * - Energy Level (1-5)
 * - Soreness Level (1-5, inverted)
 * - Stress Level (1-5, inverted)
 */

export interface ReadinessInput {
  sleepQuality: number; // 1–5
  energy: number; // 1–5
  soreness: number; // 1–5 (inverted)
  stress: number; // 1–5 (inverted)
}

export interface ReadinessScore {
  score: number; // 0–100
  factors: {
    sleepQuality: number;
    energy: number;
    soreness: number;
    stress: number;
  };
}

/**
 * Normalize a value from 1-5 scale to 0-100 scale
 */
function normalizeFactor(value: number): number {
  return ((value - 1) / 4) * 100;
}

/**
 * Invert a normalized value (for factors where higher = worse)
 */
function invertNormalized(normalized: number): number {
  return 100 - normalized;
}

/**
 * Calculate readiness score based on daily inputs
 *
 * @param input - Daily readiness inputs (sleep, energy, soreness, stress)
 * @returns ReadinessScore with overall score and individual factor scores
 */
export function calculateReadiness(input: ReadinessInput): ReadinessScore {
  // Normalize each factor to 0-100 scale
  const normalizedSleep = normalizeFactor(input.sleepQuality);
  const normalizedEnergy = normalizeFactor(input.energy);

  // Invert soreness and stress (higher values = lower readiness)
  const normalizedSoreness = normalizeFactor(input.soreness);
  const normalizedSorenessInverted = invertNormalized(normalizedSoreness);

  const normalizedStress = normalizeFactor(input.stress);
  const normalizedStressInverted = invertNormalized(normalizedStress);

  // Weighting factors (initial version)
  const SLEEP_WEIGHT = 0.3; // 30%
  const ENERGY_WEIGHT = 0.3; // 30%
  const SORENESS_WEIGHT = 0.2; // 20%
  const STRESS_WEIGHT = 0.2; // 20%

  // Calculate weighted sum
  const weightedScore =
    normalizedSleep * SLEEP_WEIGHT +
    normalizedEnergy * ENERGY_WEIGHT +
    normalizedSorenessInverted * SORENESS_WEIGHT +
    normalizedStressInverted * STRESS_WEIGHT;

  // Round to nearest integer
  const score = Math.round(weightedScore);

  // TODO: Integrate HRV data when available
  // - Add HRV as additional factor with weight
  // - Consider HRV trends over last 3-7 days

  // TODO: Integrate sleep duration
  // - Factor in actual hours slept (target 7-9 hours)
  // - Adjust sleep quality score based on duration

  // TODO: Integrate morning HR or recovery metrics
  // - Add resting heart rate as factor
  // - Consider heart rate variability (HRV)
  // - Include recovery metrics from wearable devices

  return {
    score,
    factors: {
      sleepQuality: normalizedSleep,
      energy: normalizedEnergy,
      soreness: normalizedSorenessInverted,
      stress: normalizedStressInverted,
    },
  };
}
