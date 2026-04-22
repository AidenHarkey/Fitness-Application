/**
 * Epley estimated 1RM: weight * (1 + reps / 30)
 */
export function epleyE1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * In-session volume for a set: weight * reps
 */
export function setVolume(weight: number, reps: number): number {
  return weight * reps;
}
