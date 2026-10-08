import { calculatePersonalRecords } from "./analyticsEngine";
import type { AppSettings, CoachData, LeanBackup, RecoveryCheck, RestTimer, WorkoutSession } from "./types";
import type { WorkoutTemplate } from "./workouts";

export const APP_VERSION = "2.6.5";
export const SCHEMA_VERSION = 5;

export function createBackup(args: {
  workouts: WorkoutSession[];
  templates: WorkoutTemplate[];
  settings: AppSettings;
  coachData: CoachData;
  timers: RestTimer[];
}): LeanBackup {
  const recovery = args.workouts.map((workout) => workout.recovery).filter(Boolean) as RecoveryCheck[];
  return {
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    backupDate: new Date().toISOString(),
    workouts: args.workouts,
    templates: args.templates,
    settings: args.settings,
    coachData: args.coachData,
    timers: args.timers,
    notes: args.workouts.flatMap((workout) => workout.notes ? [workout.notes] : []),
    preferences: args.settings,
    recovery,
    progression: [],
    history: args.workouts,
    personalRecords: calculatePersonalRecords(args.workouts)
  };
}

export function validateBackup(value: unknown): value is LeanBackup {
  if (!value || typeof value !== "object") return false;
  const backup = value as Partial<LeanBackup>;
  return Array.isArray(backup.workouts) && Array.isArray(backup.templates) && typeof backup.backupDate === "string" && typeof backup.schemaVersion === "number";
}

export function backupFilename(date = new Date()) {
  return `LeanME_Backup_${date.toISOString().slice(0, 10)}.json`;
}
