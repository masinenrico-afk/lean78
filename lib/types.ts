import type { TemplateId, Tempo, WorkoutTemplate } from "./workouts";

export type TechniqueRating = "Perfetta" | "Buona" | "Instabile" | "Scarsa";
export type ProgressionState = "BUILDING" | "CONSOLIDATING" | "READY" | "NEW_LOAD";

export type WorkoutSet = {
  reps: number;
  weight: number;
  completed: boolean;
  completedAt?: string;
};

export type ExerciseFeedback = {
  technique?: TechniqueRating;
  rpe?: number;
  rir?: number;
  notes?: string;
};

export type WorkoutExercise = {
  name: string;
  plannedSets: number;
  plannedReps: number;
  plannedWeight: number;
  tempo?: Tempo;
  holdSeconds?: number;
  sets: WorkoutSet[];
  feedback: ExerciseFeedback;
  progressionState?: ProgressionState;
  progressionNote?: string;
};

export type RecoveryCheck = {
  sleep: number;
  energy: number;
  soreness: number;
  createdAt: string;
};

export type WorkoutSession = {
  id: string;
  templateId: TemplateId;
  templateName: WorkoutTemplate["name"];
  mission: string;
  weeklyFocus: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  notes?: string;
  recovery?: RecoveryCheck;
  returnFromBreak?: boolean;
  reentryUntil?: string;
  expressMinutes: number;
  exercises: WorkoutExercise[];
  coachSummary?: string[];
  victories?: string[];
};

export type ActiveWorkoutRecord = {
  id: "activeWorkout";
  session: WorkoutSession | null;
};

export type RestTimer = {
  id: "rest";
  exercise: string;
  durationSeconds: number;
  startTime: number;
  endTime: number;
  running: boolean;
  pausedRemainingSeconds: number;
  notified: boolean;
};

export type PersonalRecord = {
  exercise: string;
  highestWeight: number;
  estimatedOneRepMax: number;
  bestVolume: number;
  longestProgression: number;
};

export type AppSettings = {
  id: "settings";
  autopilot: boolean;
  backupReminder: boolean;
  backupReminderDismissed?: boolean;
  lastBackupAt?: string;
};

export type CoachData = {
  id: "coach";
  weeklyGoals: string[];
  updatedAt: string;
};

export type LeanBackup = {
  appVersion: string;
  schemaVersion: number;
  backupDate: string;
  workouts: WorkoutSession[];
  templates: WorkoutTemplate[];
  settings: AppSettings;
  coachData: CoachData;
  timers: RestTimer[];
  notes: string[];
  preferences: AppSettings;
  recovery: RecoveryCheck[];
  progression: unknown[];
  history: WorkoutSession[];
  personalRecords: PersonalRecord[];
};
