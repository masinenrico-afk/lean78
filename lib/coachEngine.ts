import { workoutVolume } from "./analyticsEngine";
import { workoutProgressions } from "./progressionEngine";
import { recoveryStatus } from "./recoveryEngine";
import type { WorkoutSession } from "./types";

export function warmupAdvice(templateName: string) {
  if (templateName === "DAY A" || templateName === "DAY C") {
    return ["Cat Camel", "Rotazioni toraciche", "Wall Slides", "Face Pull"];
  }
  return ["Cat Camel", "Rotazioni toraciche", "Wall Slides"];
}

export function weeklyGoals(history: WorkoutSession[]) {
  const last = history[0];
  if (!last) return ["Inizia con calma", "Usa range completo", "Registra la tecnica"];
  const goals = workoutProgressions(history.slice(1), last).slice(0, 2).map((item) => `${item.exercise}: ${item.label.toLowerCase()}`);
  return [...goals, "Mobilita toracica"].slice(0, 3);
}

export function coachSummary(history: WorkoutSession[], workout: WorkoutSession) {
  const decisions = workoutProgressions(history, workout).slice(0, 4);
  const summary = [
    recoveryStatus(workout.recovery),
    `Volume sessione: ${Math.round(workoutVolume(workout)).toLocaleString("it-IT")} kg.`,
    ...decisions.map((decision) => `${decision.exercise}: ${decision.detail}`)
  ];
  return summary;
}

export function victories(workout: WorkoutSession) {
  const wins = new Set<string>();
  for (const exercise of workout.exercises) {
    if (exercise.feedback.technique === "Perfetta") wins.add("Tecnica migliore");
    if (exercise.feedback.technique === "Buona") wins.add("Esecuzione stabile");
    if ((exercise.feedback.rpe ?? 8) <= 7 && exercise.sets.some((set) => set.completed)) wins.add("Piu controllo sotto carico");
  }
  if (workout.recovery && workout.recovery.soreness <= 2) wins.add("Recupero gestito bene");
  return [...wins].slice(0, 4);
}
