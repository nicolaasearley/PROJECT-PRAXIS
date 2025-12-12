export interface WorkoutRecord {
  id: string;
  planDayId: string;
  date: string; // ISO
  startTime: number;
  endTime: number;
  durationMin: number;

  blocks: {
    blockId: string;
    title: string;
    type: string;
    prescribedSets: number;
    prescribedReps: number | null;
    targetRpe: number | null;

    sets: {
      completed: boolean;
      weight: number | null;
      rpe: number | null;
      restTimeMs: number | null;
    }[];

    // Calculated:
    volume: number;
    avgRpe: number | null;
    avgRestSec: number | null;
  }[];

  // Workout-level calculations:
  totalVolume: number;
  avgRpe: number | null;
  avgRestSec: number | null;
  densityScore: number;
  intensityScore: number;
}
