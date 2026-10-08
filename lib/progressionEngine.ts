import { EXERCISES } from "./workouts";
import { exerciseVolume } from "./analyticsEngine";
import { shouldMaintainLoad } from "./recoveryEngine";
import type { ProgressionState, WorkoutExercise, WorkoutSession } from "./types";

export type ProgressionDecision = {
  exercise: string;
  state: ProgressionState;
  label: string;
  detail: string;
  why: string;
  doThis: string;
  avoid: string;
  suggestedWeight?: number;
};

const CONTROL_STEPS = ["eccentrica di 3 secondi", "pausa di 2 secondi", "ROM perfetto", "una ripetizione in piu"];

export function progressionForExercise(history: WorkoutSession[], exercise: WorkoutExercise, recovery = history[0]?.recovery, returnFromBreak = false): ProgressionDecision {
  const definition = EXERCISES[exercise.name];
  if (!definition) {
    return decision(exercise.name, "BUILDING", "Costruisci", "Tieni un carico gestibile e registra qualche sessione.", "Non ho ancora metadati completi per questo esercizio.", "Muoviti bene e salva lo storico.", "Non cercare PR oggi.");
  }

  const completed = exercise.sets.filter((set) => set.completed);
  const technique = exercise.feedback.technique;
  const rpe = exercise.feedback.rpe ?? 7;
  const previous = previousExercise(history, exercise.name);
  const previousSets = previous?.sets.filter((set) => set.completed) ?? [];
  const usesAssistance = definition.loadDirection === "assistance";
  const currentWeight = completed.length ? progressionLoad(completed.map((set) => set.weight), usesAssistance) : exercise.plannedWeight;
  const previousWeight = previousSets.length ? progressionLoad(previousSets.map((set) => set.weight), usesAssistance) : undefined;
  const reachedTopReps = completed.length >= definition.defaultSets && completed.every((set) => set.reps >= definition.repTarget);
  const previousReachedTopReps = previousSets.length >= definition.defaultSets && previousSets.slice(0, definition.defaultSets).every((set) => set.reps >= definition.repTarget);
  const sameLoadAsPrevious = previousWeight !== undefined && Math.abs(currentWeight - previousWeight) < 0.01;
  const goodTechnique = technique === "Perfetta" || technique === "Buona" || !technique;
  const enoughInReserve = rpe <= 8;

  if (shouldMaintainLoad(recovery)) {
    return decision(exercise.name, "CONSOLIDATING", "Mantieni", "Recupero basso. Tieni lo stesso carico e rendi le ripetizioni fluide.", "Sonno, energia o dolori suggeriscono una giornata di mantenimento.", "Qualità e controllo.", "Non aumentare solo per chiudere il numero.");
  }
  if (returnFromBreak) {
    return decision(exercise.name, "BUILDING", "Rientro", "Sessione di rientro: non inseguire numeri, ricostruisci ritmo e tecnica.", "C'è stata una pausa lunga abbastanza da meritare gradualità.", "Lascia 2-4 ripetizioni in riserva.", "Non cercare record oggi.");
  }
  if (technique === "Scarsa" || technique === "Instabile") {
    return decision(exercise.name, "CONSOLIDATING", "Tecnica prima", "Tieni il carico. Migliora il controllo prima di aumentare.", "La tecnica non è ancora stabile.", "Ripeti con ROM pulito e ritmo controllato.", "Non aggiungere peso oggi.");
  }
  if (rpe >= 9) {
    return decision(exercise.name, "CONSOLIDATING", "Ripeti", "È stato impegnativo. Ripeti questo peso con esecuzione più calma.", "La fatica percepita è alta.", "Mantieni il carico e cerca più margine.", "Non trasformare ogni serie in test.");
  }
  if (!completed.length || !completed.every((set) => set.reps >= definition.repTarget)) {
    return decision(exercise.name, "BUILDING", "Costruisci reps", `Punta a ${definition.defaultSets} serie vicine a ${definition.repTarget} reps prima di aumentare.`, "Sei ancora dentro la fase di costruzione.", "Aggiungi ripetizioni mantenendo controllo.", "Non serve aumentare il carico.");
  }

  if (previousWeight !== undefined && isHarderLoad(currentWeight, previousWeight, usesAssistance)) {
    return decision(exercise.name, "NEW_LOAD", usesAssistance ? "Meno assistenza" : "Nuovo carico", usesAssistance ? "Hai già ridotto l'assistenza. Ricostruisci ripetizioni e sicurezza con questo supporto." : "Hai già aumentato. Ricostruisci ripetizioni e sicurezza a questo peso.", usesAssistance ? "Meno assistenza rende la trazione più difficile." : "Il carico corrente è più alto della volta precedente.", "Lascia margine e cura traiettoria/ROM.", "Non forzare un altro salto.");
  }

  if (!reachedTopReps || !previousReachedTopReps || !sameLoadAsPrevious || !goodTechnique || !enoughInReserve) {
    return decision(exercise.name, "CONSOLIDATING", "Consolida", "Hai raggiunto il target. Ripetere questo carico una volta in più va benissimo.", "LeanME cerca stabilità prima del prossimo salto.", "Rendi lo stesso peso più pulito e controllato.", "Non devi aumentare oggi.");
  }

  const suggestedWeight = usesAssistance ? Math.max(0, currentWeight - definition.increment) : currentWeight + definition.increment;
  if (usesAssistance) {
    return decision(exercise.name, "READY", "Riduci assistenza", `Se ti senti bene, puoi considerare ${suggestedWeight}kg di assistenza. Meno assistenza significa una trazione più difficile.`, "Hai consolidato target, controllo e recupero con l'assistenza attuale.", "Riduci l'assistenza solo se il ROM resta pulito.", "Non ridurre l'assistenza per dovere.", suggestedWeight);
  }
  if (definition.increment >= 10) {
    const priorCount = history.filter((workout) => workout.exercises.some((item) => item.name === exercise.name && exerciseVolume(item) > 0)).length;
    return decision(exercise.name, "READY", "Pronto con calma", `La macchina salta di ${definition.increment}kg. Puoi considerare ${suggestedWeight}kg, oppure usare ${CONTROL_STEPS[priorCount % CONTROL_STEPS.length]} e consolidare.`, "Prestazione stabile, ma il salto è grande.", "Scegli tra micro-progressione tecnica o prossimo pin.", "Non sentirti obbligato ad aumentare.", suggestedWeight);
  }

  return decision(exercise.name, "READY", "Pronto", "Se ti senti bene, puoi considerare il prossimo carico. Consolidare ancora è comunque progresso.", "Target ripetuto con buon controllo e recupero adeguato.", "Aumenta solo se il movimento resta pulito.", "Non aumentare per dovere.", suggestedWeight);
}

function progressionLoad(weights: number[], assistance: boolean) {
  return assistance ? Math.min(...weights) : Math.max(...weights);
}

function isHarderLoad(current: number, previous: number, assistance: boolean) {
  return assistance ? current < previous : current > previous;
}

export function workoutProgressions(history: WorkoutSession[], workout: WorkoutSession) {
  return workout.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).map((exercise) => progressionForExercise(history, exercise, workout.recovery, workout.returnFromBreak));
}

function previousExercise(history: WorkoutSession[], exerciseName: string) {
  return [...history]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((workout) => workout.exercises)
    .find((exercise) => exercise.name === exerciseName && exercise.sets.some((set) => set.completed));
}

function decision(exercise: string, state: ProgressionState, label: string, detail: string, why: string, doThis: string, avoid: string, suggestedWeight?: number): ProgressionDecision {
  return { exercise, state, label, detail, why, doThis, avoid, suggestedWeight };
}
