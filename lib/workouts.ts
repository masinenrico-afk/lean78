export type ExerciseKind = "compound" | "machine" | "isolation" | "abs";
export type TemplateId = "day-a" | "day-b" | "day-c";
export type Tempo = "3-0-1" | "4-1-1" | "2-1-2";

export type ExerciseDefinition = {
  name: string;
  kind: ExerciseKind;
  focus: "legs" | "chest" | "back" | "shoulders" | "arms" | "core";
  priority: "high" | "medium" | "low";
  defaultSets: number;
  defaultReps: number;
  repTarget: number;
  repRange: string;
  defaultWeight: number;
  increment: number;
  tempo?: Tempo;
  holdSeconds?: number;
  warmup?: boolean;
};

export type TemplateExercise = {
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  priority: ExerciseDefinition["priority"];
};

export type WorkoutTemplate = {
  id: TemplateId;
  name: "DAY A" | "DAY B" | "DAY C";
  mission: string;
  weeklyFocus: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
};

export const ACCENT = "#00D9FF";

export const REST_SECONDS: Record<ExerciseKind, number> = {
  compound: 120,
  machine: 90,
  isolation: 60,
  abs: 45
};

export const EXERCISES: Record<string, ExerciseDefinition> = {
  "Leg Press": { name: "Leg Press", kind: "compound", focus: "legs", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 100, increment: 10, tempo: "3-0-1" },
  "Calf Raises": { name: "Calf Raises", kind: "isolation", focus: "legs", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 20, increment: 2.5, tempo: "2-1-2" },
  "Chest Press": { name: "Chest Press", kind: "machine", focus: "chest", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 30, increment: 1.25, tempo: "3-0-1", holdSeconds: 1 },
  "Lat Machine": { name: "Lat Machine", kind: "machine", focus: "back", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 35, increment: 2.5, tempo: "3-0-1", holdSeconds: 2 },
  "Shoulder Press": { name: "Shoulder Press", kind: "machine", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 15, increment: 1.25, tempo: "3-0-1" },
  "Lateral Raises": { name: "Lateral Raises", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 3, increment: 1, tempo: "2-1-2", holdSeconds: 2 },
  "Triceps Pushdown": { name: "Triceps Pushdown", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2" },
  "Crunch Machine": { name: "Crunch Machine", kind: "abs", focus: "core", priority: "low", defaultSets: 3, defaultReps: 12, repTarget: 20, repRange: "12-20", defaultWeight: 60, increment: 2.5, tempo: "2-1-2" },
  "Hack Squat": { name: "Hack Squat", kind: "compound", focus: "legs", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 40, increment: 10, tempo: "3-0-1" },
  "Pulley Row": { name: "Pulley Row", kind: "machine", focus: "back", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 45, increment: 2.5, tempo: "3-0-1" },
  "Assisted Pull Ups": { name: "Assisted Pull Ups", kind: "machine", focus: "back", priority: "medium", defaultSets: 3, defaultReps: 6, repTarget: 10, repRange: "6-10", defaultWeight: 30, increment: 2.5, tempo: "3-0-1" },
  "Leg Curl": { name: "Leg Curl", kind: "machine", focus: "legs", priority: "medium", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 30, increment: 2.5, tempo: "3-0-1" },
  "Dumbbell Curl": { name: "Dumbbell Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 8, increment: 1.25, tempo: "2-1-2" },
  "Face Pull": { name: "Face Pull", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2", holdSeconds: 1, warmup: true },
  "Hammer Curl": { name: "Hammer Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 10, increment: 1.25, tempo: "2-1-2" },
  "Standing Calf Raise": { name: "Standing Calf Raise", kind: "isolation", focus: "legs", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 20, increment: 2.5, tempo: "2-1-2" },
  "Dumbbell Chest Press": { name: "Dumbbell Chest Press", kind: "compound", focus: "chest", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 12.5, increment: 1.25, tempo: "3-0-1" },
  "Dumbbell Shoulder Press": { name: "Dumbbell Shoulder Press", kind: "compound", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 8, increment: 1.25, tempo: "3-0-1" },
  "Cable Lateral Raise": { name: "Cable Lateral Raise", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 3, increment: 1, tempo: "2-1-2" },
  "Cable Overhead Extension": { name: "Cable Overhead Extension", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2" },
  "Cable Crunch": { name: "Cable Crunch", kind: "abs", focus: "core", priority: "low", defaultSets: 3, defaultReps: 12, repTarget: 20, repRange: "12-20", defaultWeight: 30, increment: 2.5, tempo: "2-1-2" },
  "Chest Supported Row": { name: "Chest Supported Row", kind: "machine", focus: "back", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 35, increment: 2.5, tempo: "3-0-1" },
  "Seated Leg Curl": { name: "Seated Leg Curl", kind: "machine", focus: "legs", priority: "medium", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 30, increment: 2.5, tempo: "3-0-1" },
  "Cable Curl": { name: "Cable Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 10, increment: 1.25, tempo: "2-1-2" },
  "Rear Delt Cable Fly": { name: "Rear Delt Cable Fly", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 5, increment: 1.25, tempo: "2-1-2" },
  "Rope Hammer Curl": { name: "Rope Hammer Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2" }
};

const ALTERNATIVES: Record<string, string[]> = {
  "Leg Press": ["Hack Squat"],
  "Hack Squat": ["Leg Press"],
  "Calf Raises": ["Standing Calf Raise"],
  "Standing Calf Raise": ["Calf Raises"],
  "Chest Press": ["Dumbbell Chest Press"],
  "Dumbbell Chest Press": ["Chest Press"],
  "Lat Machine": ["Assisted Pull Ups"],
  "Assisted Pull Ups": ["Lat Machine"],
  "Pulley Row": ["Chest Supported Row"],
  "Chest Supported Row": ["Pulley Row"],
  "Shoulder Press": ["Dumbbell Shoulder Press"],
  "Dumbbell Shoulder Press": ["Shoulder Press"],
  "Lateral Raises": ["Cable Lateral Raise"],
  "Cable Lateral Raise": ["Lateral Raises"],
  "Triceps Pushdown": ["Cable Overhead Extension"],
  "Cable Overhead Extension": ["Triceps Pushdown"],
  "Crunch Machine": ["Cable Crunch"],
  "Cable Crunch": ["Crunch Machine"],
  "Leg Curl": ["Seated Leg Curl"],
  "Seated Leg Curl": ["Leg Curl"],
  "Dumbbell Curl": ["Cable Curl"],
  "Cable Curl": ["Dumbbell Curl"],
  "Face Pull": ["Rear Delt Cable Fly"],
  "Rear Delt Cable Fly": ["Face Pull"],
  "Hammer Curl": ["Rope Hammer Curl"],
  "Rope Hammer Curl": ["Hammer Curl"]
};

export function exerciseAlternatives(name: string) {
  return ALTERNATIVES[name] ?? [];
}

const TEMPLATE_DATA: Record<TemplateId, { name: WorkoutTemplate["name"]; mission: string; weeklyFocus: string; exercises: string[] }> = {
  "day-a": {
    name: "DAY A",
    mission: "Costruisci spinta controllata e forza stabile.",
    weeklyFocus: "Tempo fluido, range completo, ripetizioni calme.",
    exercises: ["Leg Press", "Calf Raises", "Chest Press", "Lat Machine", "Shoulder Press", "Lateral Raises", "Triceps Pushdown", "Crunch Machine"]
  },
  "day-b": {
    name: "DAY B",
    mission: "Allena gambe forti e tirate stabili senza fretta di aumentare.",
    weeklyFocus: "Spalle stabili e tirate pulite.",
    exercises: ["Hack Squat", "Chest Press", "Pulley Row", "Assisted Pull Ups", "Leg Curl", "Dumbbell Curl", "Crunch Machine"]
  },
  "day-c": {
    name: "DAY C",
    mission: "Pratica controllo completo con volume amico delle spalle.",
    weeklyFocus: "Mobilita toracica e isolamento paziente.",
    exercises: ["Leg Press", "Calf Raises", "Lat Machine", "Pulley Row", "Chest Press", "Shoulder Press", "Lateral Raises", "Face Pull", "Triceps Pushdown", "Hammer Curl", "Crunch Machine"]
  }
};

export function createDefaultTemplates(): WorkoutTemplate[] {
  const now = new Date().toISOString();
  return (Object.keys(TEMPLATE_DATA) as TemplateId[]).map((id) => ({
    id,
    name: TEMPLATE_DATA[id].name,
    mission: TEMPLATE_DATA[id].mission,
    weeklyFocus: TEMPLATE_DATA[id].weeklyFocus,
    createdAt: now,
    updatedAt: now,
    exercises: TEMPLATE_DATA[id].exercises.map((name) => {
      const exercise = EXERCISES[name];
      return {
        name,
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        defaultWeight: exercise.defaultWeight,
        priority: exercise.priority
      };
    })
  }));
}

export function getNextTemplate(templates: WorkoutTemplate[], lastTemplateId?: TemplateId) {
  if (templates.length === 0) return undefined;
  const order: TemplateId[] = ["day-a", "day-b", "day-c"];
  const lastIndex = order.findIndex((id) => id === lastTemplateId);
  const nextId = order[(lastIndex + 1 + order.length) % order.length];
  return templates.find((template) => template.id === nextId) ?? templates[0];
}

export function expressExercises(template: WorkoutTemplate, minutes: number) {
  if (minutes >= 60) return template.exercises;
  const required = template.exercises.filter((exercise) => exercise.priority === "high");
  if (minutes <= 30) return [...required, ...template.exercises.filter((exercise) => exercise.priority === "medium").slice(0, 1)];
  if (minutes <= 45) {
    const focusOrder: ExerciseDefinition["focus"][] = ["legs", "chest", "back", "shoulders", "arms", "core"];
    const selectedNames = new Set(
      focusOrder.flatMap((focus) => {
        const candidates = template.exercises.filter((exercise) => EXERCISES[exercise.name]?.focus === focus);
        const preferred = candidates.find((exercise) => exercise.priority === "high") ?? candidates.find((exercise) => exercise.priority === "medium") ?? candidates[0];
        return preferred ? [preferred.name] : [];
      })
    );
    return template.exercises
      .filter((exercise) => selectedNames.has(exercise.name))
      .map((exercise) => ({ ...exercise, defaultSets: Math.min(2, exercise.defaultSets) }));
  }
  return template.exercises;
}
