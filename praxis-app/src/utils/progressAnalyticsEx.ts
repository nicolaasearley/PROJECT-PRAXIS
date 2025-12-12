import { ExerciseHistoryEntry } from '@/store/progressionStore';
import { getExerciseById, EXERCISES } from '@core/data/exercises';
import dayjs from 'dayjs';

/**
 * Get unique exercise names from history entries
 * Returns sorted list of exercise names
 */
export function getUniqueExercises(
  historyEntries: ExerciseHistoryEntry[]
): string[] {
  if (historyEntries.length === 0) return [];

  const exerciseIds = new Set<string>();
  historyEntries.forEach((entry) => {
    exerciseIds.add(entry.exerciseId);
  });

  // Convert IDs to names and sort
  const exerciseNames = Array.from(exerciseIds)
    .map((id) => {
      const exercise = getExerciseById(id);
      return exercise?.name || id;
    })
    .filter((name) => name !== undefined)
    .sort();

  return exerciseNames;
}

/**
 * Get history entries for a specific exercise (by name)
 * Returns entries sorted newest → oldest
 */
export function getExerciseHistory(
  historyEntries: ExerciseHistoryEntry[],
  exerciseName: string
): ExerciseHistoryEntry[] {
  if (historyEntries.length === 0) return [];

  // Find exercise ID from name
  const exercise = EXERCISES.find((ex) => ex.name === exerciseName);

  if (!exercise) return [];

  // Filter entries for this exercise
  const filtered = historyEntries.filter(
    (entry) => entry.exerciseId === exercise.id
  );

  // Sort newest → oldest
  return filtered.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Newest first
    }
    return b.sessionId.localeCompare(a.sessionId); // Tie-breaker
  });
}

/**
 * Format date label for charts
 */
function formatDateLabel(dateString: string): string {
  const date = dayjs(dateString);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  if (date.isAfter(today.subtract(7, 'day'))) {
    return date.format('ddd'); // Weekday abbreviation
  }
  return date.format('MMM D');
}

/**
 * Get weight trend for an exercise
 * Returns last 10 sessions: { dateLabel, weight }
 */
export function getExerciseWeightTrend(
  historyEntries: ExerciseHistoryEntry[]
): Array<{ dateLabel: string; weight: number }> {
  if (historyEntries.length === 0) return [];

  // Group by session (same sessionId = same workout session)
  const sessionMap = new Map<string, ExerciseHistoryEntry[]>();
  historyEntries.forEach((entry) => {
    const existing = sessionMap.get(entry.sessionId) || [];
    sessionMap.set(entry.sessionId, [...existing, entry]);
  });

  // Get average weight per session, sorted by date
  const sessionData = Array.from(sessionMap.entries())
    .map(([sessionId, entries]) => {
      const avgWeight =
        entries.reduce((sum, e) => sum + e.weight, 0) / entries.length;
      const date = entries[0].date;
      return { sessionId, date, weight: avgWeight };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    })
    .slice(0, 10) // Last 10 sessions
    .reverse(); // Oldest → newest for chart

  return sessionData.map((session) => ({
    dateLabel: formatDateLabel(session.date),
    weight: Math.round(session.weight * 10) / 10, // Round to 1 decimal
  }));
}

/**
 * Get RPE trend for an exercise
 * Returns last 10 sessions: { dateLabel, value: rpe }
 */
export function getExerciseRpeTrend(
  historyEntries: ExerciseHistoryEntry[]
): Array<{ dateLabel: string; value: number }> {
  if (historyEntries.length === 0) return [];

  // Group by session
  const sessionMap = new Map<string, ExerciseHistoryEntry[]>();
  historyEntries.forEach((entry) => {
    const existing = sessionMap.get(entry.sessionId) || [];
    sessionMap.set(entry.sessionId, [...existing, entry]);
  });

  // Get average RPE per session
  const sessionData = Array.from(sessionMap.entries())
    .map(([sessionId, entries]) => {
      const avgRpe =
        entries.reduce((sum, e) => sum + e.rpe, 0) / entries.length;
      const date = entries[0].date;
      return { sessionId, date, rpe: avgRpe };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    })
    .slice(0, 10) // Last 10 sessions
    .reverse(); // Oldest → newest for chart

  return sessionData.map((session) => ({
    dateLabel: formatDateLabel(session.date),
    value: Math.round(session.rpe * 10) / 10, // Round to 1 decimal
  }));
}

/**
 * Get volume trend for an exercise
 * Returns last 10 sessions: { dateLabel, value: volume }
 * Volume = sum of (weight * reps) for all sets in that session
 */
export function getExerciseVolumeTrend(
  historyEntries: ExerciseHistoryEntry[]
): Array<{ dateLabel: string; value: number }> {
  if (historyEntries.length === 0) return [];

  // Group by session
  const sessionMap = new Map<string, ExerciseHistoryEntry[]>();
  historyEntries.forEach((entry) => {
    const existing = sessionMap.get(entry.sessionId) || [];
    sessionMap.set(entry.sessionId, [...existing, entry]);
  });

  // Sum volume per session
  const sessionData = Array.from(sessionMap.entries())
    .map(([sessionId, entries]) => {
      const totalVolume = entries.reduce((sum, e) => sum + e.volume, 0);
      const date = entries[0].date;
      return { sessionId, date, volume: totalVolume };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Newest first
    })
    .slice(0, 10) // Last 10 sessions
    .reverse(); // Oldest → newest for chart

  return sessionData.map((session) => ({
    dateLabel: formatDateLabel(session.date),
    value: Math.round(session.volume),
  }));
}
