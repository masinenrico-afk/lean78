import { EXERCISES } from "./workouts";
import { exerciseVolume } from "./analyticsEngine";
import { shouldMaintainLoad } from "./recoveryEngine";
import type { WorkoutExercise, WorkoutSession } from "./types";

export type ProgressionDecision = {
  exercise: string;
  label: string;
  detail: string;
  suggestedWeight?: number;
};

const CONTROL_STEPS = ["eccentrica di 3 secondi", "pausa di 2 secondi", "ROM perfetto", "una ripetizione in piu"];

export function progressionForExercise(history: WorkoutSession[], exercise: WorkoutExercise, recovery = history[0]?.recovery): ProgressionDecision {
  const definition = EXERCISES[exercise.name];
  const completed = exercise.sets.filter((set) => set.completed);
  const technique = exercise.feedback.technique;
  const rpe = exercise.feedback.rpe ?? 7;

  if (shouldMaintainLoad(recovery)) {
    return { exercise: exercise.name, label: "Mantieni", detail: "Il recupero e basso. Tieni lo stesso carico e rendi le ripetizioni fluide." };
  }
  if (technique === "Scarsa" || technique === "Instabile") {
    return { exercise: exercise.name, label: "Tecnica prima", detail: "Tieni il carico. Migliora il controllo prima di aumentare." };
  }
  if (rpe >= 9) {
    return { exercise: exercise.name, label: "Ripeti", detail: "E stato impegnativo. Ripeti questo peso con esecuzione piu calma." };
  }
  if (!completed.length || !completed.every((set) => set.reps >= definition.repTarget)) {
    return { exercise: exercise.name, label: "Costruisci reps", detail: `Punta a ${definition.defaultSets} serie vicine a ${definition.repTarget} reps prima di aumentare.` };
  }

  const currentWeight = Math.max(...completed.map((set) => set.weight));
  const suggestedWeight = currentWeight + definition.increment;
  if (definition.increment >= 10) {
    const priorCount = history.filter((workout) => workout.exercises.some((item) => item.name === exercise.name && exerciseVolume(item) > 0)).length;
    return {
      exercise: exercise.name,
      label: "Blocco controllo",
      detail: `La macchina salta di ${definition.increment}kg. Usa ${CONTROL_STEPS[priorCount % CONTROL_STEPS.length]} prima di passare a ${suggestedWeight}kg.`,
      suggestedWeight
    };
  }

  return { exercise: exercise.name, label: "Pronto", detail: "Pronto per il prossimo carico se la tecnica resta pulita.", suggestedWeight };
}

export function workoutProgressions(history: WorkoutSession[], workout: WorkoutSession) {
  return workout.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).map((exercise) => progressionForExercise(history, exercise, workout.recovery));
}
