export type ExerciseKind = "compound" | "machine" | "isolation" | "abs";
export type TemplateId = "day-a" | "day-b" | "day-c";
export type Tempo = "3-0-1" | "4-1-1" | "2-1-2";

export type ExerciseDefinition = {
  name: string;
  kind: ExerciseKind;
  priority: "high" | "medium" | "low";
  defaultSets: number;
  defaultReps: number;
  repTarget: number;
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

export const ACCENT = "#B8FF00";

export const REST_SECONDS: Record<ExerciseKind, number> = {
  compound: 120,
  machine: 90,
  isolation: 60,
  abs: 45
};

export const EXERCISES: Record<string, ExerciseDefinition> = {
  "Leg Press": { name: "Leg Press", kind: "compound", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 100, increment: 10, tempo: "3-0-1" },
  "Calf Raises": { name: "Calf Raises", kind: "isolation", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 20, increment: 5, tempo: "2-1-2" },
  "Chest Press": { name: "Chest Press", kind: "machine", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 30, increment: 2.5, tempo: "3-0-1", holdSeconds: 1 },
  "Lat Machine": { name: "Lat Machine", kind: "machine", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 35, increment: 5, tempo: "3-0-1", holdSeconds: 2 },
  "Shoulder Press": { name: "Shoulder Press", kind: "machine", priority: "medium", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 15, increment: 2.5, tempo: "3-0-1" },
  "Lateral Raises": { name: "Lateral Raises", kind: "isolation", priority: "medium", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 3, increment: 1, tempo: "2-1-2", holdSeconds: 2 },
  "Triceps Pushdown": { name: "Triceps Pushdown", kind: "isolation", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 12.5, increment: 2.5, tempo: "2-1-2" },
  "Crunch Machine": { name: "Crunch Machine", kind: "abs", priority: "low", defaultSets: 3, defaultReps: 12, repTarget: 20, defaultWeight: 60, increment: 5, tempo: "2-1-2" },
  "Hack Squat": { name: "Hack Squat", kind: "compound", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 40, increment: 10, tempo: "3-0-1" },
  "Pulley Row": { name: "Pulley Row", kind: "machine", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 45, increment: 5, tempo: "3-0-1" },
  "Assisted Pull Ups": { name: "Assisted Pull Ups", kind: "machine", priority: "medium", defaultSets: 3, defaultReps: 8, repTarget: 12, defaultWeight: 30, increment: 5, tempo: "3-0-1" },
  "Leg Curl": { name: "Leg Curl", kind: "machine", priority: "medium", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 30, increment: 5, tempo: "3-0-1" },
  "Dumbbell Curl": { name: "Dumbbell Curl", kind: "isolation", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 8, increment: 2, tempo: "2-1-2" },
  "Face Pull": { name: "Face Pull", kind: "isolation", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, defaultWeight: 12.5, increment: 2.5, tempo: "2-1-2", holdSeconds: 1, warmup: true },
  "Hammer Curl": { name: "Hammer Curl", kind: "isolation", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, defaultWeight: 10, increment: 2, tempo: "2-1-2" }
};

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
  if (minutes >= 90) return template.exercises;
  const required = template.exercises.filter((exercise) => exercise.priority === "high");
  if (minutes <= 30) return [...required, ...template.exercises.filter((exercise) => exercise.priority === "medium").slice(0, 1)];
  if (minutes <= 45) return template.exercises.filter((exercise) => exercise.priority !== "low");
  return template.exercises.filter((exercise) => exercise.priority !== "low").concat(template.exercises.filter((exercise) => exercise.priority === "low").slice(0, 2));
}
