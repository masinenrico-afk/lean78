export type ExerciseKind = "compound" | "machine" | "isolation" | "abs";
export type MeasurementType = "reps" | "duration";
export type ExerciseClassification = "Fondamentale" | "Complementare" | "Isolamento" | "Core / Stabilità";
export type LoadDirection = "standard" | "assistance";
export type TemplateId = "day-a" | "day-b" | "day-c";
export type Tempo = "3-0-1" | "4-1-1" | "2-1-2";
export type ExerciseRole = "primary" | "secondary" | "accessory" | "core";
export type FatigueCost = "low" | "medium" | "high";

export type SetAllocationProfile = {
  role: ExerciseRole;
  fatigueCost: FatigueCost;
  technicalDemand: "low" | "medium" | "high";
  movementPattern: string;
  redundancyGroup?: string;
  minSets: 1 | 2;
  supersetCompatible?: boolean;
};

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
  allocation?: SetAllocationProfile;
  tempo?: Tempo;
  holdSeconds?: number;
  warmup?: boolean;
  classification?: ExerciseClassification;
  measurementType?: MeasurementType;
  targetDurationSeconds?: number;
  defaultSide?: "left" | "right" | "both";
  loadDirection?: LoadDirection;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  equipment?: string;
  technicalDifficulty?: "Base" | "Intermedia" | "Avanzata";
};

export type ExerciseAlternative = {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  classification: ExerciseClassification;
  suggestedSets: number;
  repRange: string;
  equipment: string;
  technicalDifficulty: "Base" | "Intermedia" | "Avanzata";
  difference: string;
  relationship: "equivalent" | "different-stimulus";
};

export type ExerciseLibraryDetail = {
  startingPosition: string;
  instructions: string[];
  commonMistakes: string[];
  safety: string[];
  media?: { imageSrc?: string; videoUrl?: string; attribution?: string };
};

export type TemplateExercise = {
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  priority: ExerciseDefinition["priority"];
  supersetGroup?: string;
};

export type WorkoutTemplate = {
  id: TemplateId;
  name: "DAY A" | "DAY B" | "DAY C" | "Upper" | "Lower" | "Full Body";
  mission: string;
  weeklyFocus: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
  programVersion?: number;
};

type TemplateBlueprintExercise = {
  name: string;
  defaultSets: number;
  supersetGroup?: string;
};

export const PROGRAM_VERSION = 3;

export function exerciseId(name: string) {
  return `exercise:${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export const ACCENT = "#B8FF00";

export const REST_SECONDS: Record<ExerciseKind, number> = {
  compound: 120,
  machine: 90,
  isolation: 60,
  abs: 45
};

export const EXERCISES: Record<string, ExerciseDefinition> = {
  "Leg Press": { name: "Leg Press", kind: "compound", focus: "legs", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 100, increment: 10, tempo: "3-0-1", allocation: { role: "primary", fatigueCost: "high", technicalDemand: "medium", movementPattern: "knee-dominant", redundancyGroup: "knee-dominant", minSets: 2 } },
  "Calf Raises": { name: "Calf Raises", kind: "isolation", focus: "legs", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 20, increment: 2.5, tempo: "2-1-2", allocation: { role: "secondary", fatigueCost: "low", technicalDemand: "low", movementPattern: "ankle-extension", minSets: 1, supersetCompatible: true } },
  "Chest Press": { name: "Chest Press", kind: "machine", focus: "chest", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 30, increment: 1.25, tempo: "3-0-1", holdSeconds: 1, allocation: { role: "primary", fatigueCost: "medium", technicalDemand: "medium", movementPattern: "horizontal-push", redundancyGroup: "horizontal-push", minSets: 2 } },
  "Lat Machine": { name: "Lat Machine", kind: "machine", focus: "back", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "6-10", defaultWeight: 35, increment: 2.5, tempo: "3-0-1", holdSeconds: 2, allocation: { role: "primary", fatigueCost: "medium", technicalDemand: "medium", movementPattern: "vertical-pull", redundancyGroup: "vertical-pull", minSets: 2 } },
  "Shoulder Press": { name: "Shoulder Press", kind: "machine", focus: "shoulders", priority: "medium", defaultSets: 2, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 15, increment: 1.25, tempo: "3-0-1", allocation: { role: "secondary", fatigueCost: "medium", technicalDemand: "medium", movementPattern: "vertical-push", minSets: 1 } },
  "Lateral Raises": { name: "Lateral Raises", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 3, increment: 1, tempo: "2-1-2", holdSeconds: 2 },
  "Triceps Pushdown": { name: "Triceps Pushdown", kind: "isolation", focus: "arms", priority: "low", defaultSets: 2, defaultReps: 10, repTarget: 15, repRange: "8-12", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2", allocation: { role: "accessory", fatigueCost: "low", technicalDemand: "low", movementPattern: "elbow-extension", minSets: 1, supersetCompatible: true } },
  "Crunch Machine": { name: "Crunch Machine", kind: "abs", focus: "core", priority: "low", defaultSets: 2, defaultReps: 12, repTarget: 15, repRange: "10-15", defaultWeight: 60, increment: 2.5, tempo: "2-1-2", allocation: { role: "core", fatigueCost: "low", technicalDemand: "low", movementPattern: "trunk-flexion", minSets: 1, supersetCompatible: true } },
  "Hack Squat": { name: "Hack Squat", kind: "compound", focus: "legs", priority: "high", defaultSets: 4, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 40, increment: 10, tempo: "3-0-1", allocation: { role: "primary", fatigueCost: "high", technicalDemand: "high", movementPattern: "knee-dominant", redundancyGroup: "knee-dominant", minSets: 2 } },
  "Pulley Row": { name: "Pulley Row", kind: "machine", focus: "back", priority: "high", defaultSets: 3, defaultReps: 8, repTarget: 12, repRange: "8-12", defaultWeight: 45, increment: 2.5, tempo: "3-0-1" },
  "Assisted Pull Ups": { name: "Assisted Pull Ups", kind: "machine", focus: "back", priority: "medium", defaultSets: 2, defaultReps: 6, repTarget: 10, repRange: "6-10", defaultWeight: 30, increment: 2.5, tempo: "3-0-1", loadDirection: "assistance", allocation: { role: "secondary", fatigueCost: "medium", technicalDemand: "high", movementPattern: "vertical-pull", redundancyGroup: "vertical-pull", minSets: 1 } },
  "Leg Curl": { name: "Leg Curl", kind: "machine", focus: "legs", priority: "medium", defaultSets: 3, defaultReps: 10, repTarget: 12, repRange: "8-12", defaultWeight: 30, increment: 2.5, tempo: "3-0-1", allocation: { role: "secondary", fatigueCost: "medium", technicalDemand: "low", movementPattern: "knee-flexion", redundancyGroup: "hamstrings", minSets: 1 } },
  "Dumbbell Curl": { name: "Dumbbell Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 2, defaultReps: 10, repTarget: 12, repRange: "8-12", defaultWeight: 8, increment: 1.25, tempo: "2-1-2", allocation: { role: "accessory", fatigueCost: "low", technicalDemand: "low", movementPattern: "elbow-flexion", minSets: 1, supersetCompatible: true } },
  "Face Pull": { name: "Face Pull", kind: "isolation", focus: "shoulders", priority: "medium", defaultSets: 3, defaultReps: 12, repTarget: 15, repRange: "12-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2", holdSeconds: 1, warmup: true },
  "Hammer Curl": { name: "Hammer Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 2, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 10, increment: 1.25, tempo: "2-1-2", allocation: { role: "accessory", fatigueCost: "low", technicalDemand: "low", movementPattern: "elbow-flexion", minSets: 1, supersetCompatible: true } },
  "Romanian Deadlift": { name: "Romanian Deadlift", kind: "compound", focus: "legs", priority: "high", defaultSets: 2, defaultReps: 8, repTarget: 10, repRange: "6-10", defaultWeight: 30, increment: 2.5, tempo: "3-0-1", allocation: { role: "secondary", fatigueCost: "high", technicalDemand: "high", movementPattern: "hip-hinge", minSets: 1 } },
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
  "Rope Hammer Curl": { name: "Rope Hammer Curl", kind: "isolation", focus: "arms", priority: "low", defaultSets: 3, defaultReps: 10, repTarget: 15, repRange: "10-15", defaultWeight: 12.5, increment: 1.25, tempo: "2-1-2" },
  "Plank": { name: "Plank", kind: "abs", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 0, repTarget: 0, repRange: "20-45 sec", defaultWeight: 0, increment: 0, measurementType: "duration", targetDurationSeconds: 30, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "medium", movementPattern: "anti-extension", minSets: 1, supersetCompatible: true } },
  "Side Plank": { name: "Side Plank", kind: "abs", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 0, repTarget: 0, repRange: "20-30 sec/lato", defaultWeight: 0, increment: 0, measurementType: "duration", targetDurationSeconds: 25, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "medium", movementPattern: "anti-lateral-flexion", minSets: 1, supersetCompatible: true } },
  "Hollow Hold": { name: "Hollow Hold", kind: "abs", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 0, repTarget: 0, repRange: "15-30 sec", defaultWeight: 0, increment: 0, measurementType: "duration", targetDurationSeconds: 20, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "medium", movementPattern: "anti-extension", minSets: 1, supersetCompatible: true } },
  "Dead Bug": { name: "Dead Bug", kind: "abs", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 10, repTarget: 12, repRange: "8-12/lato", defaultWeight: 0, increment: 0, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "low", movementPattern: "anti-extension", minSets: 1, supersetCompatible: true } },
  "Bird Dog": { name: "Bird Dog", kind: "abs", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 10, repTarget: 12, repRange: "8-12/lato", defaultWeight: 0, increment: 0, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "low", movementPattern: "anti-rotation", minSets: 1, supersetCompatible: true } },
  "Pallof Press": { name: "Pallof Press", kind: "isolation", focus: "core", priority: "medium", defaultSets: 2, defaultReps: 10, repTarget: 12, repRange: "10-12/lato", defaultWeight: 5, increment: 1.25, defaultSide: "both", allocation: { role: "core", fatigueCost: "low", technicalDemand: "medium", movementPattern: "anti-rotation", minSets: 1, supersetCompatible: true } }
};

const ALTERNATIVES: Record<string, Array<{ name: string; relationship: ExerciseAlternative["relationship"]; difference: string }>> = {
  "Leg Press": [{ name: "Hack Squat", relationship: "equivalent", difference: "Stesso pattern dominante di ginocchio, con una traiettoria più vincolata." }],
  "Hack Squat": [{ name: "Leg Press", relationship: "equivalent", difference: "Stesso focus su quadricipiti, con schienale e angolo diversi." }],
  "Calf Raises": [{ name: "Standing Calf Raise", relationship: "equivalent", difference: "Stessa estensione di caviglia, con carico in piedi." }],
  "Standing Calf Raise": [{ name: "Calf Raises", relationship: "equivalent", difference: "Stesso gesto, in versione più stabile." }],
  "Chest Press": [{ name: "Dumbbell Chest Press", relationship: "equivalent", difference: "Stessa spinta orizzontale, con più richiesta di stabilità." }],
  "Dumbbell Chest Press": [{ name: "Chest Press", relationship: "equivalent", difference: "Stessa spinta orizzontale, con traiettoria guidata." }],
  "Lat Machine": [{ name: "Assisted Pull Ups", relationship: "equivalent", difference: "Stessa tirata verticale; l'assistenza si riduce per rendere il gesto più difficile." }],
  "Assisted Pull Ups": [{ name: "Lat Machine", relationship: "equivalent", difference: "Stessa tirata verticale, più facilmente regolabile al cavo." }],
  "Pulley Row": [{ name: "Chest Supported Row", relationship: "equivalent", difference: "Stessa tirata orizzontale, con meno richiesta lombare." }],
  "Chest Supported Row": [{ name: "Pulley Row", relationship: "equivalent", difference: "Stessa tirata orizzontale, con maggiore libertà di assetto." }],
  "Shoulder Press": [{ name: "Dumbbell Shoulder Press", relationship: "equivalent", difference: "Stessa spinta verticale, con più stabilità richiesta ai manubri." }],
  "Dumbbell Shoulder Press": [{ name: "Shoulder Press", relationship: "equivalent", difference: "Stessa spinta verticale, con macchina più stabile." }],
  "Lateral Raises": [{ name: "Cable Lateral Raise", relationship: "equivalent", difference: "Stesso isolamento del deltoide laterale, con tensione più costante." }, { name: "Face Pull", relationship: "different-stimulus", difference: "Lavora soprattutto deltoidi posteriori e controllo scapolare, non sostituisce completamente l'alzata laterale." }],
  "Cable Lateral Raise": [{ name: "Lateral Raises", relationship: "equivalent", difference: "Stesso isolamento del deltoide laterale, con manubri." }],
  "Triceps Pushdown": [{ name: "Cable Overhead Extension", relationship: "equivalent", difference: "Stesso tricipite, con enfasi più marcata sul capo lungo." }],
  "Cable Overhead Extension": [{ name: "Triceps Pushdown", relationship: "equivalent", difference: "Stesso tricipite, con assetto più stabile." }],
  "Crunch Machine": [{ name: "Cable Crunch", relationship: "equivalent", difference: "Stessa flessione del tronco, con cavo regolabile." }, { name: "Plank", relationship: "different-stimulus", difference: "Allena anti-estensione e stabilità, non è equivalente alla flessione del tronco." }, { name: "Dead Bug", relationship: "different-stimulus", difference: "Allena controllo lombo-pelvico e coordinazione, non la stessa flessione." }],
  "Cable Crunch": [{ name: "Crunch Machine", relationship: "equivalent", difference: "Stessa flessione del tronco, con macchina più guidata." }, { name: "Hollow Hold", relationship: "different-stimulus", difference: "Allena anti-estensione a tempo, non sostituisce la flessione del tronco." }],
  "Leg Curl": [{ name: "Seated Leg Curl", relationship: "equivalent", difference: "Stesso lavoro di flessione del ginocchio, con anca più flessa." }, { name: "Romanian Deadlift", relationship: "different-stimulus", difference: "Coinvolge femorali in estensione d'anca: è complementare, non equivalente." }],
  "Seated Leg Curl": [{ name: "Leg Curl", relationship: "equivalent", difference: "Stesso lavoro sui femorali, con assetto diverso." }],
  "Dumbbell Curl": [{ name: "Cable Curl", relationship: "equivalent", difference: "Stessa flessione di gomito, con tensione più costante." }, { name: "Hammer Curl", relationship: "different-stimulus", difference: "Maggiore enfasi su brachiale e presa neutra." }],
  "Cable Curl": [{ name: "Dumbbell Curl", relationship: "equivalent", difference: "Stessa flessione di gomito, con carico libero." }],
  "Face Pull": [{ name: "Rear Delt Cable Fly", relationship: "equivalent", difference: "Stesso focus posteriore della spalla, con meno rotazione esterna." }, { name: "Cable Lateral Raise", relationship: "different-stimulus", difference: "Focus sul deltoide laterale: non è una sostituzione equivalente." }],
  "Rear Delt Cable Fly": [{ name: "Face Pull", relationship: "equivalent", difference: "Stesso focus posteriore, con più rotazione esterna e controllo scapolare." }],
  "Hammer Curl": [{ name: "Rope Hammer Curl", relationship: "equivalent", difference: "Stesso pattern a presa neutra, al cavo." }, { name: "Dumbbell Curl", relationship: "different-stimulus", difference: "Più enfasi sul bicipite in supinazione." }],
  "Rope Hammer Curl": [{ name: "Hammer Curl", relationship: "equivalent", difference: "Stesso pattern a presa neutra, con manubri." }]
};

const MUSCLES: Record<ExerciseDefinition["focus"], { primary: string; secondary: string[] }> = {
  legs: { primary: "Gambe", secondary: ["Glutei", "Core"] },
  chest: { primary: "Petto", secondary: ["Tricipiti", "Spalle anteriori"] },
  back: { primary: "Schiena", secondary: ["Bicipiti", "Deltoidi posteriori"] },
  shoulders: { primary: "Spalle", secondary: ["Tricipiti", "Parte alta della schiena"] },
  arms: { primary: "Braccia", secondary: ["Avambracci"] },
  core: { primary: "Core", secondary: ["Stabilizzatori dell'anca", "Schiena"] }
};

export function exerciseClassification(name: string): ExerciseClassification {
  const definition = EXERCISES[name];
  if (definition?.classification) return definition.classification;
  const role = definition?.allocation?.role;
  if (role === "core" || definition?.focus === "core" || definition?.kind === "abs") return "Core / Stabilità";
  if (role === "primary" || definition?.kind === "compound") return "Fondamentale";
  if (role === "accessory" || definition?.kind === "isolation") return "Isolamento";
  return "Complementare";
}

export function classificationExplanation(classification: ExerciseClassification) {
  return {
    "Fondamentale": "Movimento prioritario: costruisce la base di forza e coordinazione.",
    "Complementare": "Completa il lavoro principale con volume mirato e tecnica controllata.",
    "Isolamento": "Concentra lo stimolo su un distretto, con fatica sistemica contenuta.",
    "Core / Stabilità": "Allena controllo del tronco, respirazione e stabilità prima del carico."
  }[classification];
}

export function exerciseAlternatives(name: string): ExerciseAlternative[] {
  return (ALTERNATIVES[name] ?? []).map((option) => alternativeDetail(option));
}

function alternativeDetail(option: { name: string; relationship: ExerciseAlternative["relationship"]; difference: string }): ExerciseAlternative {
  const definition = EXERCISES[option.name];
  const muscles = MUSCLES[definition.focus];
  return {
    exerciseId: exerciseId(option.name), name: option.name, primaryMuscle: definition.primaryMuscle ?? muscles.primary,
    secondaryMuscles: definition.secondaryMuscles ?? muscles.secondary, movementPattern: definition.allocation?.movementPattern ?? definition.focus,
    classification: exerciseClassification(option.name), suggestedSets: definition.defaultSets, repRange: definition.repRange,
    equipment: definition.equipment ?? equipmentFor(definition), technicalDifficulty: definition.technicalDifficulty ?? difficultyFor(definition),
    difference: option.difference, relationship: option.relationship
  };
}

export function exerciseLibraryDetail(name: string): ExerciseLibraryDetail {
  const definition = EXERCISES[name];
  const timed = definition?.measurementType === "duration";
  return {
    startingPosition: timed ? "Sistema colonna e bacino neutri; respira senza perdere tensione." : "Regola seduta e carico, poi trova un assetto stabile prima della prima ripetizione.",
    instructions: timed ? ["Avvia il timer solo quando l'assetto è stabile.", "Mantieni respiro regolare e tensione continua.", "Interrompi se perdi posizione o senti dolore."] : ["Muovi il carico con controllo nel ROM che riesci a gestire.", "Mantieni il ritmo previsto senza slanci.", "Fermati prima che la tecnica cambi."],
    commonMistakes: timed ? ["Trattenere il respiro", "Compensare con la schiena", "Prolungare la tenuta perdendo controllo"] : ["Usare slancio", "Accorciare il ROM", "Aumentare il carico prima di controllarlo"],
    safety: ["Nessun dolore articolare acuto.", "Regola macchina e appoggi prima della serie.", "Riduci carico o interrompi se l'esecuzione peggiora." ]
  };
}

function equipmentFor(definition: ExerciseDefinition) { return definition.kind === "compound" ? "Macchina o pesi liberi" : definition.kind === "abs" ? "Corpo libero o macchina" : "Macchina, cavo o manubri"; }
function difficultyFor(definition: ExerciseDefinition): "Base" | "Intermedia" | "Avanzata" { return definition.allocation?.technicalDemand === "high" ? "Avanzata" : definition.allocation?.technicalDemand === "medium" ? "Intermedia" : "Base"; }

const TEMPLATE_DATA: Record<TemplateId, { name: WorkoutTemplate["name"]; mission: string; weeklyFocus: string; exercises: TemplateBlueprintExercise[] }> = {
  "day-a": {
    name: "Upper",
    mission: "Upper: spinta e tirata solide, senza fretta.",
    weeklyFocus: "Petto, schiena, spalle e braccia con esecuzione pulita.",
    exercises: [
      { name: "Chest Press", defaultSets: 3 },
      { name: "Lat Machine", defaultSets: 3 },
      { name: "Dumbbell Shoulder Press", defaultSets: 2 },
      { name: "Assisted Pull Ups", defaultSets: 2 },
      { name: "Dumbbell Curl", defaultSets: 2, supersetGroup: "A" },
      { name: "Triceps Pushdown", defaultSets: 2, supersetGroup: "A" }
    ]
  },
  "day-b": {
    name: "Lower",
    mission: "Lower: gambe forti, posterior chain controllata.",
    weeklyFocus: "Knee-dominant, femorali, polpacci e core.",
    exercises: [
      { name: "Hack Squat", defaultSets: 4 },
      { name: "Leg Curl", defaultSets: 3 },
      { name: "Romanian Deadlift", defaultSets: 2 },
      { name: "Calf Raises", defaultSets: 3, supersetGroup: "B" },
      { name: "Crunch Machine", defaultSets: 2, supersetGroup: "B" }
    ]
  },
  "day-c": {
    name: "Full Body",
    mission: "Full body: stimolo completo, fatica gestibile.",
    weeklyFocus: "Spinta, tirata, gambe, spalle, braccia e core.",
    exercises: [
      { name: "Chest Press", defaultSets: 2 },
      { name: "Lat Machine", defaultSets: 2 },
      { name: "Leg Press", defaultSets: 3 },
      { name: "Leg Curl", defaultSets: 2 },
      { name: "Dumbbell Shoulder Press", defaultSets: 2 },
      { name: "Dumbbell Curl", defaultSets: 1 },
      { name: "Crunch Machine", defaultSets: 2 }
    ]
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
    programVersion: PROGRAM_VERSION,
    exercises: TEMPLATE_DATA[id].exercises.map((entry) => {
      const exercise = EXERCISES[entry.name];
      return {
        name: entry.name,
        defaultSets: entry.defaultSets,
        defaultReps: exercise.defaultReps,
        defaultWeight: exercise.defaultWeight,
        priority: exercise.priority,
        supersetGroup: entry.supersetGroup
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
  const reference = template.exercises.map((exercise) => ({ ...exercise }));
  if (minutes >= 60) return reference;
  if (minutes <= 30) return allocateCompressedWorkout(reference, 0.58, true);
  return allocateCompressedWorkout(reference, 0.8, false);
}

function allocateCompressedWorkout(reference: TemplateExercise[], ratio: number, compact: boolean) {
  const minimumCoverage = compact ? selectMajorMovementCoverage(reference) : reference;
  const exercises = removeRedundancy(minimumCoverage).map((exercise) => ({ ...exercise }));
  const referenceSets = exercises.reduce((total, exercise) => total + exercise.defaultSets, 0);
  const minimumSets = exercises.reduce((total, exercise) => total + allocationFor(exercise.name).minSets, 0);
  const targetSets = Math.max(minimumSets, Math.round(referenceSets * ratio));

  while (exercises.reduce((total, exercise) => total + exercise.defaultSets, 0) > targetSets) {
    const candidate = exercises
      .filter((exercise) => exercise.defaultSets > allocationFor(exercise.name).minSets)
      .sort((left, right) => compressionPriority(left) - compressionPriority(right))[0];
    if (!candidate) break;
    candidate.defaultSets -= 1;
  }

  return exercises;
}

function selectMajorMovementCoverage(exercises: TemplateExercise[]) {
  const selected = new Set<string>();
  const selectedPatterns = new Set<string>();
  const include = (exercise: TemplateExercise) => {
    selected.add(exercise.name);
    selectedPatterns.add(allocationFor(exercise.name).movementPattern);
  };
  for (const exercise of exercises) {
    const profile = allocationFor(exercise.name);
    if (profile.role === "primary") include(exercise);
  }
  for (const focus of ["chest", "back", "legs", "shoulders", "arms", "core"] as ExerciseDefinition["focus"][]) {
    const candidate = exercises.find((exercise) => EXERCISES[exercise.name]?.focus === focus);
    if (candidate) include(candidate);
  }
  for (const exercise of exercises) {
    const profile = allocationFor(exercise.name);
    if (profile.role === "secondary" && !selectedPatterns.has(profile.movementPattern)) include(exercise);
  }
  return exercises.filter((exercise) => selected.has(exercise.name));
}

function removeRedundancy(exercises: TemplateExercise[]) {
  const seenGroups = new Set<string>();
  return exercises.filter((exercise) => {
    const profile = allocationFor(exercise.name);
    const group = profile.redundancyGroup;
    if (!group || !seenGroups.has(group)) {
      if (group) seenGroups.add(group);
      return true;
    }
    return profile.role === "primary";
  });
}

function compressionPriority(exercise: TemplateExercise) {
  const profile = allocationFor(exercise.name);
  const roleScore: Record<ExerciseRole, number> = { accessory: 0, core: 1, secondary: 2, primary: 3 };
  const fatigueScore: Record<FatigueCost, number> = { low: 0, medium: 1, high: 2 };
  return roleScore[profile.role] * 10 + fatigueScore[profile.fatigueCost];
}

function allocationFor(name: string): SetAllocationProfile {
  const definition = EXERCISES[name];
  if (definition?.allocation) return definition.allocation;
  return {
    role: definition?.priority === "high" ? "primary" : definition?.priority === "medium" ? "secondary" : definition?.kind === "abs" ? "core" : "accessory",
    fatigueCost: definition?.kind === "compound" ? "high" : definition?.kind === "machine" ? "medium" : "low",
    technicalDemand: definition?.kind === "compound" ? "medium" : "low",
    movementPattern: definition?.focus ?? "general",
    minSets: definition?.priority === "high" ? 2 : 1,
    supersetCompatible: definition?.kind === "isolation" || definition?.kind === "abs"
  };
}
