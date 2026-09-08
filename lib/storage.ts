import { coachSummary, victories } from "./coachEngine";
import { createBackup, validateBackup } from "./backupEngine";
import { workoutProgressions } from "./progressionEngine";
import { shouldMaintainLoad } from "./recoveryEngine";
import type { ActiveWorkoutRecord, AppSettings, CoachData, LeanBackup, RestTimer, WorkoutSession } from "./types";
import { EXERCISES, expressExercises, createDefaultTemplates, type WorkoutTemplate } from "./workouts";

const DB_NAME = "leanme-db";
const DB_VERSION = 3;
const LEGACY_DB_NAME = "lean78-db";
const LEGACY_DB_VERSION = 2;

type StoreName = "workouts" | "templates" | "appState" | "timers" | "settings" | "coach";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("workouts")) {
        const workouts = db.createObjectStore("workouts", { keyPath: "id" });
        workouts.createIndex("startedAt", "startedAt");
        workouts.createIndex("templateId", "templateId");
      }
      if (!db.objectStoreNames.contains("templates")) db.createObjectStore("templates", { keyPath: "id" });
      if (!db.objectStoreNames.contains("appState")) db.createObjectStore("appState", { keyPath: "id" });
      if (!db.objectStoreNames.contains("timers")) db.createObjectStore("timers", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "id" });
      if (!db.objectStoreNames.contains("coach")) db.createObjectStore("coach", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase(dbName: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("workouts")) db.createObjectStore("workouts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("templates")) db.createObjectStore("templates", { keyPath: "id" });
    };
  });
}

async function storeTransaction<T>(storeName: StoreName, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function getAll<T>(storeName: StoreName) {
  return storeTransaction<T[]>(storeName, "readonly", (store) => store.getAll());
}

export async function putItem<T>(storeName: StoreName, value: T) {
  await storeTransaction<IDBValidKey>(storeName, "readwrite", (store) => store.put(value));
}

export async function getItem<T>(storeName: StoreName, key: IDBValidKey) {
  return storeTransaction<T | undefined>(storeName, "readonly", (store) => store.get(key));
}

export async function deleteItem(storeName: StoreName, key: IDBValidKey) {
  await storeTransaction<undefined>(storeName, "readwrite", (store) => store.delete(key));
}

export async function seedAppData() {
  await migrateLegacyLean78Data();

  const templates = await getAll<WorkoutTemplate>("templates");
  if (templates.length === 0) await Promise.all(createDefaultTemplates().map((template) => putItem("templates", template)));

  if (!(await getItem<ActiveWorkoutRecord>("appState", "activeWorkout"))) {
    await putItem<ActiveWorkoutRecord>("appState", { id: "activeWorkout", session: null });
  }
  if (!(await getItem<AppSettings>("settings", "settings"))) {
    await putItem<AppSettings>("settings", { id: "settings", autopilot: true, backupReminder: true });
  }
  if (!(await getItem<CoachData>("coach", "coach"))) {
    await putItem<CoachData>("coach", { id: "coach", weeklyGoals: ["Muoviti bene", "Registra la tecnica", "La costanza vince"], updatedAt: new Date().toISOString() });
  }
}

async function migrateLegacyLean78Data() {
  if (!(await legacyDatabaseMayExist())) return;

  try {
    const [currentWorkouts, currentTemplates, legacyWorkouts, legacyTemplates] = await Promise.all([
      getAll<WorkoutSession>("workouts"),
      getAll<WorkoutTemplate>("templates"),
      readLegacyStore<Partial<WorkoutSession>>("workouts"),
      readLegacyStore<Partial<WorkoutTemplate>>("templates")
    ]);

    const currentWorkoutIds = new Set(currentWorkouts.map((workout) => workout.id));
    const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));
    const defaultTemplates = createDefaultTemplates();

    await Promise.all(
      legacyTemplates
        .map((template) => normalizeLegacyTemplate(template, defaultTemplates))
        .filter((template) => !currentTemplateIds.has(template.id))
        .map((template) => putItem("templates", template))
    );

    await Promise.all(
      legacyWorkouts
        .map((workout) => normalizeLegacyWorkout(workout, defaultTemplates))
        .filter((workout) => workout.id && !currentWorkoutIds.has(workout.id))
        .map((workout) => putItem("workouts", workout))
    );
  } catch (error) {
    console.warn("Migrazione storico Lean78 non riuscita", error);
  }
}

async function legacyDatabaseMayExist() {
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string }>> };
  if (!factory.databases) return true;
  const databases = await factory.databases();
  return databases.some((database) => database.name === LEGACY_DB_NAME);
}

async function readLegacyStore<T>(storeName: "workouts" | "templates") {
  const db = await openDatabase(LEGACY_DB_NAME, LEGACY_DB_VERSION);
  if (!db.objectStoreNames.contains(storeName)) {
    db.close();
    return [] as T[];
  }

  return new Promise<T[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function normalizeLegacyTemplate(template: Partial<WorkoutTemplate>, defaults: WorkoutTemplate[]): WorkoutTemplate {
  const fallback = defaults.find((item) => item.id === template.id) ?? defaults[0];
  const now = new Date().toISOString();
  return {
    ...fallback,
    ...template,
    id: fallback.id,
    name: fallback.name,
    mission: template.mission ?? fallback.mission,
    weeklyFocus: template.weeklyFocus ?? fallback.weeklyFocus,
    createdAt: template.createdAt ?? fallback.createdAt ?? now,
    updatedAt: template.updatedAt ?? now,
    exercises: fallback.exercises.map((defaultExercise) => {
      const legacyExercise = template.exercises?.find((exercise) => exercise.name === defaultExercise.name) as
        | { weight?: number; targetSets?: number; targetReps?: number }
        | undefined;
      return {
        ...defaultExercise,
        defaultSets: legacyExercise?.targetSets ?? defaultExercise.defaultSets,
        defaultReps: legacyExercise?.targetReps ?? defaultExercise.defaultReps,
        defaultWeight: legacyExercise?.weight ?? defaultExercise.defaultWeight
      };
    })
  };
}

function normalizeLegacyWorkout(workout: Partial<WorkoutSession>, defaults: WorkoutTemplate[]): WorkoutSession {
  const fallback = defaults.find((template) => template.id === workout.templateId) ?? defaults[0];
  const startedAt = workout.startedAt ?? new Date().toISOString();

  return {
    id: workout.id ?? uid("legacy-workout"),
    templateId: fallback.id,
    templateName: fallback.name,
    mission: workout.mission ?? fallback.mission,
    weeklyFocus: workout.weeklyFocus ?? fallback.weeklyFocus,
    startedAt,
    completedAt: workout.completedAt,
    durationSeconds: workout.durationSeconds,
    expressMinutes: workout.expressMinutes ?? 90,
    recovery: workout.recovery,
    coachSummary: workout.coachSummary,
    victories: workout.victories,
    notes: workout.notes,
    exercises: (workout.exercises ?? []).map((exercise) => {
      const definition = EXERCISES[exercise.name];
      const sets = exercise.sets ?? [];
      const firstSet = sets[0];
      return {
        name: exercise.name,
        plannedSets: exercise.plannedSets ?? (sets.length || definition?.defaultSets || 3),
        plannedReps: exercise.plannedReps ?? firstSet?.reps ?? definition?.defaultReps ?? 8,
        plannedWeight: exercise.plannedWeight ?? firstSet?.weight ?? definition?.defaultWeight ?? 0,
        tempo: exercise.tempo,
        holdSeconds: exercise.holdSeconds,
        sets,
        feedback: exercise.feedback ?? {}
      };
    })
  };
}

export function createWorkout(template: WorkoutTemplate, expressMinutes: number, history: WorkoutSession[] = []): WorkoutSession {
  const exercises = expressExercises(template, expressMinutes);
  const returnFromBreak = isReturnFromBreak(history);
  return {
    id: uid("workout"),
    templateId: template.id,
    templateName: template.name,
    mission: template.mission,
    weeklyFocus: template.weeklyFocus,
    startedAt: new Date().toISOString(),
    expressMinutes,
    returnFromBreak,
    reentryUntil: returnFromBreak ? new Date(Date.now() + 7 * 86400000).toISOString() : undefined,
    exercises: exercises.map((exercise) => {
      const previous = previousExerciseValues(history, exercise.name);
      const previousWeight = previous[0]?.weight;
      const previousReps = previous[0]?.reps;
      const plannedWeight = returnFromBreak && previousWeight ? roundToStep(previousWeight * 0.9, 1.25) : previousWeight ?? exercise.defaultWeight;
      const plannedReps = previousReps ?? exercise.defaultReps;

      return {
        name: exercise.name,
        plannedSets: exercise.defaultSets,
        plannedReps,
        plannedWeight,
        sets: Array.from({ length: exercise.defaultSets }, (_, index) => ({
          reps: previous[index]?.reps ?? plannedReps,
          weight: returnFromBreak ? plannedWeight : previous[index]?.weight ?? plannedWeight,
          completed: false
        })),
        feedback: {}
      };
    })
  };
}

export function previousExerciseValues(workouts: WorkoutSession[], exerciseName: string) {
  const previousWorkout = [...workouts]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .find((workout) => workout.exercises.some((exercise) => exercise.name === exerciseName && exercise.sets.some((set) => set.completed)));

  return previousWorkout?.exercises.find((exercise) => exercise.name === exerciseName)?.sets.filter((set) => set.completed) ?? [];
}

export function suggestedWeightForExercise(workouts: WorkoutSession[], exerciseName: string) {
  const definition = EXERCISES[exerciseName];
  if (!definition) return undefined;

  const recent = [...workouts]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((workout) => {
      const exercise = workout.exercises.find((item) => item.name === exerciseName && item.sets.some((set) => set.completed));
      return exercise ? [{ exercise, recovery: workout.recovery }] : [];
    })
    .slice(0, 2);
  if (recent.length < 2) return undefined;

  const [latest, prior] = recent;
  const isStableSession = (item: (typeof recent)[number]) => {
    const sets = item.exercise.sets.filter((set) => set.completed).slice(0, definition.defaultSets);
    const technique = item.exercise.feedback.technique;
    const rpe = item.exercise.feedback.rpe ?? 7;
    const rir = item.exercise.feedback.rir;
    return sets.length >= definition.defaultSets
      && sets.every((set) => set.reps >= definition.repTarget)
      && technique !== "Scarsa"
      && technique !== "Instabile"
      && rpe <= 8
      && (rir === undefined || rir >= 1)
      && !shouldMaintainLoad(item.recovery);
  };
  if (!isStableSession(latest) || !isStableSession(prior)) return undefined;

  const previousWeight = Math.max(...latest.exercise.sets.filter((set) => set.completed).map((set) => set.weight));
  const priorWeight = Math.max(...prior.exercise.sets.filter((set) => set.completed).map((set) => set.weight));
  if (Math.abs(previousWeight - priorWeight) > 0.01) return undefined;

  return roundToStep(previousWeight + definition.increment, 0.01);
}

export function normalizeWorkout(session: WorkoutSession): WorkoutSession {
  const durationSeconds =
    session.durationSeconds ??
    (session.completedAt ? Math.max(0, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)) : undefined);
  return {
    ...session,
    durationSeconds,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      feedback: exercise.feedback ?? {}
    }))
  };
}

export function completeWorkout(session: WorkoutSession, history: WorkoutSession[]) {
  const completedAt = new Date().toISOString();
  const completed = {
    ...session,
    completedAt,
    durationSeconds: Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000))
  };
  const decisions = workoutProgressions(history, completed);
  return {
    ...completed,
    exercises: completed.exercises.map((exercise) => {
      const decision = decisions.find((item) => item.exercise === exercise.name);
      return {
        ...exercise,
        progressionState: decision?.state,
        progressionNote: decision?.detail
      };
    }),
    coachSummary: coachSummary(history, completed),
    victories: victories(completed)
  };
}

export function daysSinceLastCompletedWorkout(history: WorkoutSession[]) {
  const last = [...history].filter((workout) => workout.completedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (!last) return 0;
  return Math.floor((Date.now() - new Date(last.startedAt).getTime()) / 86400000);
}

export function isReturnFromBreak(history: WorkoutSession[]) {
  const days = daysSinceLastCompletedWorkout(history);
  return days >= 10;
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

export async function exportBackup() {
  const [workouts, templates, settings, coachData, timers] = await Promise.all([
    getAll<WorkoutSession>("workouts"),
    getAll<WorkoutTemplate>("templates"),
    getItem<AppSettings>("settings", "settings"),
    getItem<CoachData>("coach", "coach"),
    getAll<RestTimer>("timers")
  ]);
  return createBackup({
    workouts,
    templates,
    settings: settings ?? { id: "settings", autopilot: true, backupReminder: true },
    coachData: coachData ?? { id: "coach", weeklyGoals: [], updatedAt: new Date().toISOString() },
    timers
  });
}

export function previewBackup(value: unknown) {
  if (!validateBackup(value)) return null;
  const exerciseNames = new Set(value.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name)));
  return {
    backupDate: value.backupDate,
    workoutCount: value.workouts.length,
    exerciseCount: exerciseNames.size,
    prCount: value.personalRecords?.length ?? 0
  };
}

export async function importBackup(backup: LeanBackup) {
  if (!validateBackup(backup)) throw new Error("Backup LeanME non valido.");
  const temporaryBackup = await exportBackup();
  try {
    await Promise.all(backup.templates.map((template) => putItem("templates", template)));
    await Promise.all(backup.workouts.map((workout) => putItem("workouts", workout)));
    await putItem("settings", backup.settings);
    await putItem("coach", backup.coachData);
    return temporaryBackup;
  } catch (error) {
    await Promise.all(temporaryBackup.templates.map((template) => putItem("templates", template)));
    await Promise.all(temporaryBackup.workouts.map((workout) => putItem("workouts", workout)));
    await putItem("settings", temporaryBackup.settings);
    await putItem("coach", temporaryBackup.coachData);
    throw error;
  }
}
