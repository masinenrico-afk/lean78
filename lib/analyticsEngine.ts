import type { PersonalRecord, WorkoutExercise, WorkoutSession, WorkoutSet } from "./types";

export function setVolume(set: WorkoutSet) {
  return set.completed ? set.weight * set.reps : 0;
}

export function exerciseVolume(exercise: WorkoutExercise) {
  return exercise.sets.reduce((total, set) => total + setVolume(set), 0);
}

export function workoutVolume(workout: WorkoutSession) {
  return workout.exercises.reduce((total, exercise) => total + exerciseVolume(exercise), 0);
}

export function completedSetCount(workout: WorkoutSession) {
  return workout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length;
}

export function completedExerciseCount(workout: WorkoutSession) {
  return workout.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).length;
}

export function calculatePersonalRecords(workouts: WorkoutSession[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>();
  const sorted = [...workouts].filter((workout) => workout.completedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const progressionChains = new Map<string, { lastWeight: number; chain: number; best: number }>();

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      const sets = exercise.sets.filter((set) => set.completed);
      if (!sets.length) continue;

      const current = records.get(exercise.name) ?? {
        exercise: exercise.name,
        highestWeight: 0,
        estimatedOneRepMax: 0,
        bestVolume: 0,
        longestProgression: 0
      };
      const maxWeight = Math.max(...sets.map((set) => set.weight));
      const chain = progressionChains.get(exercise.name) ?? { lastWeight: 0, chain: 0, best: 0 };
      chain.chain = maxWeight > chain.lastWeight ? chain.chain + 1 : chain.chain;
      chain.best = Math.max(chain.best, chain.chain);
      chain.lastWeight = Math.max(chain.lastWeight, maxWeight);
      progressionChains.set(exercise.name, chain);

      current.highestWeight = Math.max(current.highestWeight, maxWeight);
      current.estimatedOneRepMax = Math.max(current.estimatedOneRepMax, ...sets.map((set) => set.weight * (1 + set.reps / 30)));
      current.bestVolume = Math.max(current.bestVolume, exerciseVolume(exercise));
      current.longestProgression = Math.max(current.longestProgression, chain.best);
      records.set(exercise.name, current);
    }
  }

  return [...records.values()].sort((a, b) => a.exercise.localeCompare(b.exercise));
}

export function lifetimeStats(workouts: WorkoutSession[]) {
  const completed = workouts.filter((workout) => workout.completedAt);
  const hours = completed.reduce((total, workout) => total + (workout.durationSeconds ?? 0), 0) / 3600;
  const totalVolume = completed.reduce((total, workout) => total + workoutVolume(workout), 0);
  const monthlyConsistency = new Set(completed.map((workout) => workout.startedAt.slice(0, 10))).size;
  return {
    workoutsCompleted: completed.length,
    hoursTrained: hours,
    totalVolume,
    currentPrs: calculatePersonalRecords(completed).length,
    monthlyConsistency
  };
}

export function exerciseTimeline(workouts: WorkoutSession[], exerciseName: string) {
  return [...workouts]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((workout) => {
      const exercise = workout.exercises.find((item) => item.name === exerciseName);
      const weight = exercise ? Math.max(0, ...exercise.sets.filter((set) => set.completed).map((set) => set.weight)) : 0;
      return weight ? { date: workout.startedAt, weight } : null;
    })
    .filter(Boolean) as { date: string; weight: number }[];
}
