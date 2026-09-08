"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculatePersonalRecords, completedSetCount, exerciseTimeline, exerciseVolume, lifetimeStats, workoutVolume } from "@/lib/analyticsEngine";
import { APP_VERSION, backupFilename, validateBackup } from "@/lib/backupEngine";
import { warmupAdvice, weeklyGoals } from "@/lib/coachEngine";
import { progressionForExercise, workoutProgressions } from "@/lib/progressionEngine";
import { recoveryScore, recoveryStatus } from "@/lib/recoveryEngine";
import {
  completeWorkout,
  createWorkout,
  deleteItem,
  exportBackup,
  getAll,
  getItem,
  importBackup,
  normalizeWorkout,
  previousExerciseValues,
  previewBackup,
  putItem,
  seedAppData,
  suggestedWeightForExercise,
  daysSinceLastCompletedWorkout
} from "@/lib/storage";
import type { ActiveWorkoutRecord, AppSettings, CoachData, LeanBackup, RecoveryCheck, RestTimer, TechniqueRating, WorkoutSession } from "@/lib/types";
import { EXERCISES, REST_SECONDS, exerciseAlternatives, getNextTemplate, type TemplateId, type WorkoutTemplate } from "@/lib/workouts";

type Tab = "home" | "workout" | "history" | "progress" | "coach" | "settings";

const dateFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" });

export default function LeanApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ id: "settings", autopilot: true, backupReminder: true });
  const [coachData, setCoachData] = useState<CoachData>({ id: "coach", weeklyGoals: [], updatedAt: "" });
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("day-a");
  const [expressMinutes, setExpressMinutes] = useState(60);
  const [timer, setTimer] = useState<RestTimer | null>(null);
  const [now, setNow] = useState(Date.now());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [importPreview, setImportPreview] = useState<ReturnType<typeof previewBackup>>(null);
  const [finishArmed, setFinishArmed] = useState(false);
  const importPayload = useRef<LeanBackup | null>(null);

  useEffect(() => {
    async function boot() {
      await seedAppData();
      await refresh();
      const active = await getItem<ActiveWorkoutRecord>("appState", "activeWorkout");
      const storedTimer = await getItem<RestTimer>("timers", "rest");
      setActiveWorkout(active?.session ?? null);
      if (active?.session) setSelectedTemplateId(active.session.templateId);
      setTimer(storedTimer ?? null);
      setNotificationPermission("Notification" in window ? Notification.permission : "unsupported");
      registerServiceWorker();
    }
    boot();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    const sync = () => setNow(Date.now());
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const timerRemaining = useMemo(() => getTimerRemaining(timer, now), [timer, now]);

  useEffect(() => {
    if (!timer || !timer.running || timerRemaining > 0 || timer.notified) return;
    const expired = { ...timer, running: false, pausedRemainingSeconds: 0, notified: true };
    setTimer(expired);
    putItem("timers", expired);
    notifyTimerDone(timer.exercise);
  }, [timer, timerRemaining]);

  useEffect(() => {
    if (!finishArmed) return;
    const timeout = window.setTimeout(() => setFinishArmed(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [finishArmed]);

  async function refresh() {
    const [storedTemplates, storedHistory, storedSettings, storedCoach] = await Promise.all([
      getAll<WorkoutTemplate>("templates"),
      getAll<WorkoutSession>("workouts"),
      getItem<AppSettings>("settings", "settings"),
      getItem<CoachData>("coach", "coach")
    ]);
    const sortedHistory = storedHistory.filter((workout) => workout.completedAt).map(normalizeWorkout).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    setTemplates(storedTemplates.sort((a, b) => a.id.localeCompare(b.id)));
    setHistory(sortedHistory);
    if (storedSettings) setSettings(storedSettings);
    if (storedCoach) setCoachData(storedCoach);
  }

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];
  const nextTemplate = getNextTemplate(templates, history[0]?.templateId) ?? selectedTemplate;
  const stats = useMemo(() => lifetimeStats(history), [history]);
  const records = useMemo(() => calculatePersonalRecords(history), [history]);
  const progressions = useMemo(() => history[0] ? workoutProgressions(history.slice(1), history[0]) : [], [history]);
  const goals = useMemo(() => coachData.weeklyGoals.length ? coachData.weeklyGoals : weeklyGoals(history), [coachData, history]);
  const progress = activeWorkout ? Math.round((completedSetCount(activeWorkout) / activeWorkout.exercises.flatMap((exercise) => exercise.sets).length) * 100) : 0;
  const needsBackup = !settings.lastBackupAt || daysBetween(settings.lastBackupAt, new Date().toISOString()) >= 30;
  const daysAway = daysSinceLastCompletedWorkout(history);

  async function startWorkout() {
    if (!nextTemplate) return;
    const session = createWorkout(settings.autopilot ? nextTemplate : selectedTemplate, expressMinutes, history);
    session.recovery = { sleep: 3, energy: 3, soreness: 3, createdAt: new Date().toISOString() };
    setActiveWorkout(session);
    setSelectedTemplateId(session.templateId);
    setTab("workout");
    await putItem<ActiveWorkoutRecord>("appState", { id: "activeWorkout", session });
  }

  async function persistActive(session: WorkoutSession | null) {
    setActiveWorkout(session);
    await putItem<ActiveWorkoutRecord>("appState", { id: "activeWorkout", session });
  }

  async function finishWorkout() {
    if (!activeWorkout || completedSetCount(activeWorkout) === 0) return;
    const completed = completeWorkout(activeWorkout, history);
    await putItem("workouts", completed);
    await persistActive(null);
    await closeTimer();
    const nextGoals = weeklyGoals([completed, ...history]);
    const nextCoach = { id: "coach", weeklyGoals: nextGoals, updatedAt: new Date().toISOString() } satisfies CoachData;
    await putItem("coach", nextCoach);
    setCoachData(nextCoach);
    await refresh();
    setTab("coach");
  }

  async function requestFinishWorkout() {
    if (!activeWorkout || completedSetCount(activeWorkout) === 0) return;
    const totalSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets).length;
    if (completedSetCount(activeWorkout) < totalSets && !finishArmed) {
      setFinishArmed(true);
      return;
    }
    setFinishArmed(false);
    await finishWorkout();
  }

  async function reopenWorkout(workout: WorkoutSession) {
    const session = structuredClone(workout);
    session.completedAt = undefined;
    session.durationSeconds = undefined;
    session.coachSummary = undefined;
    session.victories = undefined;
    setFinishArmed(false);
    await closeTimer();
    setActiveWorkout(session);
    setSelectedTemplateId(session.templateId);
    await putItem<ActiveWorkoutRecord>("appState", { id: "activeWorkout", session });
    setTab("workout");
  }

  async function completeSet(exerciseIndex: number, setIndex: number) {
    if (!activeWorkout) return;
    const session = structuredClone(activeWorkout);
    const exercise = session.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    set.completed = !set.completed;
    set.completedAt = set.completed ? new Date().toISOString() : undefined;
    setFinishArmed(false);
    await persistActive(session);
    if (set.completed) await startRestTimer(exercise.name, REST_SECONDS[EXERCISES[exercise.name].kind]);
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: string) {
    if (!activeWorkout) return;
    const parsed = parseLocaleNumber(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const session = structuredClone(activeWorkout);
    session.exercises[exerciseIndex].sets[setIndex][field] = field === "reps" ? Math.round(parsed) : parsed;
    if (field === "weight") session.exercises[exerciseIndex].plannedWeight = parsed;
    setFinishArmed(false);
    setActiveWorkout(session);
  }

  async function persistSetEdits() {
    if (!activeWorkout) return;
    await persistActive(activeWorkout);
    await persistTemplateWeights(activeWorkout);
  }

  async function useAlternative(exerciseIndex: number, alternativeName: string) {
    if (!activeWorkout || !EXERCISES[alternativeName]) return;
    const session = structuredClone(activeWorkout);
    const current = session.exercises[exerciseIndex];
    const originalName = current.name;
    const definition = EXERCISES[alternativeName];
    const previous = previousExerciseValues(history, alternativeName);
    const plannedWeight = previous[0]?.weight ?? definition.defaultWeight;
    const plannedReps = previous[0]?.reps ?? definition.defaultReps;

    session.exercises[exerciseIndex] = {
      ...current,
      name: alternativeName,
      plannedReps,
      plannedWeight,
      sets: Array.from({ length: current.plannedSets }, (_, index) => ({
        reps: previous[index]?.reps ?? plannedReps,
        weight: previous[index]?.weight ?? plannedWeight,
        completed: false
      })),
      feedback: {}
    };

    const nextTemplates = templates.map((template) => template.id !== session.templateId ? template : {
      ...template,
      updatedAt: new Date().toISOString(),
      exercises: template.exercises.map((exercise) => exercise.name !== originalName ? exercise : {
        ...exercise,
        name: alternativeName,
        defaultWeight: plannedWeight,
        defaultReps: plannedReps
      })
    });
    setTemplates(nextTemplates);
    await persistActive(session);
    await Promise.all(nextTemplates.filter((template) => template.id === session.templateId).map((template) => putItem("templates", template)));
  }

  async function persistTemplateWeights(session: WorkoutSession) {
    const nextTemplates = templates.map((template) => {
      if (template.id !== session.templateId) return template;
      return {
        ...template,
        updatedAt: new Date().toISOString(),
        exercises: template.exercises.map((templateExercise) => {
          const workoutExercise = session.exercises.find((exercise) => exercise.name === templateExercise.name);
          return workoutExercise ? { ...templateExercise, defaultWeight: workoutExercise.plannedWeight } : templateExercise;
        })
      };
    });
    setTemplates(nextTemplates);
    await Promise.all(nextTemplates.filter((template) => template.id === session.templateId).map((template) => putItem("templates", template)));
  }

  async function setRecovery(field: keyof Omit<RecoveryCheck, "createdAt">, value: number) {
    if (!activeWorkout) return;
    const session = structuredClone(activeWorkout);
    session.recovery = { ...(session.recovery ?? { sleep: 3, energy: 3, soreness: 3, createdAt: new Date().toISOString() }), [field]: value };
    await persistActive(session);
  }

  async function setFeedback(exerciseIndex: number, field: "technique" | "rpe" | "rir" | "notes", value: string | number) {
    if (!activeWorkout) return;
    const session = structuredClone(activeWorkout);
    session.exercises[exerciseIndex].feedback = { ...session.exercises[exerciseIndex].feedback, [field]: value };
    await persistActive(session);
  }

  async function updateSettings(next: AppSettings) {
    setSettings(next);
    await putItem("settings", next);
  }

  async function startRestTimer(exercise: string, durationSeconds: number) {
    const startTime = Date.now();
    const rest: RestTimer = { id: "rest", exercise, durationSeconds, startTime, endTime: startTime + durationSeconds * 1000, running: true, pausedRemainingSeconds: durationSeconds, notified: false };
    setTimer(rest);
    setNow(startTime);
    await putItem("timers", rest);
  }

  async function toggleTimer() {
    if (!timer) return;
    const currentTime = Date.now();
    const remaining = getTimerRemaining(timer, currentTime);
    const next = timer.running
      ? { ...timer, running: false, pausedRemainingSeconds: remaining }
      : { ...timer, running: true, startTime: currentTime, endTime: currentTime + (remaining || timer.durationSeconds) * 1000, pausedRemainingSeconds: remaining || timer.durationSeconds, notified: false };
    setTimer(next);
    await putItem("timers", next);
  }

  async function adjustTimer(seconds: number) {
    if (!timer) return;
    const currentTime = Date.now();
    const remaining = Math.max(0, getTimerRemaining(timer, currentTime) + seconds);
    const next = timer.running ? { ...timer, endTime: currentTime + remaining * 1000, notified: false } : { ...timer, pausedRemainingSeconds: remaining, notified: false };
    setTimer(next);
    await putItem("timers", next);
  }

  async function closeTimer() {
    setTimer(null);
    await deleteItem("timers", "rest");
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return setNotificationPermission("unsupported");
    setNotificationPermission(await Notification.requestPermission());
  }

  async function downloadBackup() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFilename();
    link.click();
    URL.revokeObjectURL(url);
    await updateSettings({ ...settings, lastBackupAt: new Date().toISOString(), backupReminderDismissed: false });
  }

  async function onImportFile(file?: File) {
    if (!file) return;
    const parsed = JSON.parse(await file.text()) as unknown;
    const preview = previewBackup(parsed);
    if (!preview || !validateBackup(parsed)) return;
    importPayload.current = parsed;
    setImportPreview(preview);
  }

  async function confirmImport() {
    if (!importPayload.current) return;
    await importBackup(importPayload.current);
    importPayload.current = null;
    setImportPreview(null);
    await refresh();
  }

  if (!selectedTemplate) return <Loading />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/92 px-5 pb-3 pt-4 backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/45">LeanME</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black">{titleFor(tab)}</h1>
          {activeWorkout && <button className="rounded-xl bg-accent/15 px-3 py-2 text-xs font-black text-accent" onClick={() => setTab("workout")}>{progress}% ATTIVO</button>}
        </div>
      </header>

      <div className={`flex-1 px-5 pt-5 ${activeWorkout && timer ? "pb-64" : "pb-40"}`}>
        {tab === "home" && <HomeScreen activeWorkout={activeWorkout} nextTemplate={nextTemplate} stats={stats} goals={goals} settings={settings} expressMinutes={expressMinutes} setExpressMinutes={setExpressMinutes} needsBackup={needsBackup} daysAway={daysAway} onStart={startWorkout} onResume={() => setTab("workout")} onBackup={downloadBackup} onLater={() => updateSettings({ ...settings, backupReminderDismissed: true })} />}
        {tab === "workout" && <WorkoutScreen activeWorkout={activeWorkout} history={history} templates={templates} selectedTemplate={selectedTemplate} selectedTemplateId={selectedTemplateId} expressMinutes={expressMinutes} progress={progress} finishArmed={finishArmed} notificationPermission={notificationPermission} onSelectTemplate={setSelectedTemplateId} onExpress={setExpressMinutes} onStart={startWorkout} onRecovery={setRecovery} onCompleteSet={completeSet} onSetChange={updateSet} onSetBlur={persistSetEdits} onFeedback={setFeedback} onAlternative={useAlternative} onFinish={requestFinishWorkout} onDiscard={() => persistActive(null)} onEnableNotifications={enableNotifications} />}
        {tab === "history" && <HistoryScreen history={history} onReopen={reopenWorkout} />}
        {tab === "progress" && <ProgressScreen history={history} records={records} stats={stats} />}
        {tab === "coach" && <CoachScreen history={history} goals={goals} progressions={progressions} daysAway={daysAway} />}
        {tab === "settings" && <SettingsScreen settings={settings} importPreview={importPreview} history={history} onSettings={updateSettings} onBackup={downloadBackup} onImportFile={onImportFile} onConfirmImport={confirmImport} onCancelImport={() => setImportPreview(null)} />}
      </div>

      {activeWorkout && timer && <FixedTimerBadge timer={timer} remaining={timerRemaining} onToggle={toggleTimer} onAdjust={adjustTimer} onClose={closeTimer} />}
      <BottomNav active={tab} setActive={setTab} />
    </main>
  );
}

function HomeScreen({ activeWorkout, nextTemplate, stats, goals, settings, expressMinutes, setExpressMinutes, needsBackup, daysAway, onStart, onResume, onBackup, onLater }: any) {
  return (
    <section className="space-y-5">
      <Panel highlight>
        <p className="text-sm text-white/55">Prossimo allenamento</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-5xl font-black">{activeWorkout ? activeWorkout.templateName : nextTemplate.name}</h2>
            <p className="mt-2 text-sm text-white/65">{activeWorkout ? "Pronto quando vuoi." : nextTemplate.mission}</p>
          </div>
          <button className="min-h-14 rounded-xl bg-white px-5 font-black text-ink" onClick={activeWorkout ? onResume : onStart}>{activeWorkout ? "Riprendi" : "Inizia"}</button>
        </div>
      </Panel>

      {daysAway >= 10 && !activeWorkout && <Panel highlight><p className="text-sm font-black text-accent">Settimana di rientro</p><h3 className="mt-1 text-2xl font-black">Riparti senza rincorrere i numeri.</h3><p className="mt-2 text-sm text-white/65">Sono passati {daysAway} giorni. LeanME userà circa il 90% dei carichi precedenti e più margine.</p></Panel>}

      <Panel>
        <p className="text-sm text-white/55">Focus della settimana</p>
        <h3 className="mt-1 text-2xl font-black">{nextTemplate.weeklyFocus}</h3>
        <div className="mt-4 flex flex-wrap gap-2">{goals.map((goal: string) => <Chip key={goal}>{goal}</Chip>)}</div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">Allenamento Express</p>
            <h3 className="text-xl font-black">{expressMinutes} minuti</h3>
          </div>
          <Segmented values={[30, 45, 60, 90]} value={expressMinutes} onChange={setExpressMinutes} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Completati" value={String(stats.workoutsCompleted)} />
        <Stat label="Ore allenate" value={formatNumber(stats.hoursTrained)} />
      </div>

      {settings.backupReminder && needsBackup && !settings.backupReminderDismissed && (
        <Panel>
          <p className="font-black">È passato un po' dall'ultimo backup.</p>
          <p className="mt-1 text-sm text-white/55">Proteggi i tuoi progressi in 10 secondi.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="min-h-12 rounded-xl bg-accent font-black text-ink" onClick={onBackup}>Backup ora</button>
            <button className="min-h-12 rounded-xl bg-white/[0.08] font-bold" onClick={onLater}>Più tardi</button>
          </div>
        </Panel>
      )}
    </section>
  );
}

function WorkoutScreen(props: any) {
  const { activeWorkout, history, templates, selectedTemplate, selectedTemplateId, expressMinutes, progress, finishArmed, notificationPermission, onSelectTemplate, onExpress, onStart, onRecovery, onCompleteSet, onSetChange, onSetBlur, onFeedback, onAlternative, onFinish, onDiscard, onEnableNotifications } = props;
  return (
    <section className="space-y-5">
      {!activeWorkout && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">{templates.map((template: WorkoutTemplate) => <button key={template.id} className={`min-h-12 min-w-24 rounded-xl border px-4 text-sm font-black ${selectedTemplateId === template.id ? "border-white bg-white text-ink" : "border-white/10 bg-white/[0.06]"}`} onClick={() => onSelectTemplate(template.id)}>{template.name}</button>)}</div>
          <Panel><p className="text-sm text-white/55">Missione</p><h2 className="mt-1 text-2xl font-black">{selectedTemplate.mission}</h2><div className="mt-4"><Segmented values={[30, 45, 60, 90]} value={expressMinutes} onChange={onExpress} /></div><button className="mt-4 min-h-14 w-full rounded-xl bg-white font-black text-ink" onClick={onStart}>Inizia allenamento</button></Panel>
        </>
      )}

      {activeWorkout && (
        <>
          <Panel highlight>
            <p className="text-sm text-white/55">Controllo recupero</p>
            <h2 className="mt-1 text-2xl font-black">{recoveryStatus(activeWorkout.recovery)}</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Scale label="Sonno" value={activeWorkout.recovery?.sleep ?? 3} onChange={(v) => onRecovery("sleep", v)} />
              <Scale label="Energia" value={activeWorkout.recovery?.energy ?? 3} onChange={(v) => onRecovery("energy", v)} />
              <Scale label="Dolori" value={activeWorkout.recovery?.soreness ?? 3} onChange={(v) => onRecovery("soreness", v)} />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between"><div><p className="text-sm text-white/55">Missione allenamento</p><h2 className="text-2xl font-black">{activeWorkout.templateName} · {progress}%</h2></div><Chip>{formatNumber(recoveryScore(activeWorkout.recovery))}/5</Chip></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
          </Panel>

          {activeWorkout.returnFromBreak && <Panel highlight><p className="text-sm font-black text-accent">Settimana di rientro</p><h2 className="mt-1 text-2xl font-black">Non inseguire i numeri oggi.</h2><p className="mt-2 text-sm text-white/65">La tua performance precedente è salvata. Ricostruiamo ritmo, tecnica e sicurezza con gradualità.</p></Panel>}

          {warmupAdvice(activeWorkout.templateName).length > 0 && <Panel><p className="text-sm text-white/55">Preparazione 3-5 minuti</p><div className="mt-3 flex flex-wrap gap-2">{warmupAdvice(activeWorkout.templateName).map((item: string) => <Chip key={item}>{item}</Chip>)}</div></Panel>}

          {activeWorkout.exercises.map((exercise: WorkoutSession["exercises"][number], exerciseIndex: number) => {
            const definition = EXERCISES[exercise.name];
            const previous = previousExerciseValues(history, exercise.name);
            const suggestedWeight = activeWorkout.returnFromBreak ? undefined : suggestedWeightForExercise(history, exercise.name);
            const decision = progressionForExercise(history, exercise, activeWorkout.recovery, activeWorkout.returnFromBreak);
            const alternatives = exerciseAlternatives(exercise.name);
            return (
              <Panel key={exercise.name}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><h3 className="text-xl font-black">{exercise.name}</h3><p className="mt-1 text-sm text-white/50">{exercise.plannedSets} serie · {definition.repRange} reps · tempo {definition.tempo ?? "naturale"}{definition.holdSeconds ? ` · tenuta ${definition.holdSeconds}s` : ""}</p>{alternatives.length > 0 && <select className="mt-2 min-h-9 max-w-full rounded-lg border border-white/10 bg-white/[0.06] px-2 text-xs font-bold text-white" defaultValue="" onChange={(event) => { if (event.target.value) onAlternative(exerciseIndex, event.target.value); }}><option value="">Usa un'alternativa oggi</option>{alternatives.map((alternative) => <option key={alternative} value={alternative}>{alternative}</option>)}</select>}{previous.length > 0 && <p className="mt-2 text-xs font-bold text-white/45">Ultima volta: {previous.map((set) => `${formatNumber(set.weight)}kg × ${set.reps}`).join(" · ")}</p>}<p className="mt-2 text-xs font-black text-accent">{stateLabel(decision.state)} · {decision.label}</p><p className="mt-1 text-xs text-white/50">{decision.doThis}</p>{suggestedWeight && <p className="mt-1 text-xs font-black text-accent">Puoi considerare: {formatNumber(suggestedWeight)}kg</p>}</div>
                  <Chip>{stateLabel(decision.state)}</Chip>
                </div>
                <div className="space-y-2">{exercise.sets.map((set, setIndex) => <div className="grid grid-cols-[2rem_1fr_1fr_4.4rem] items-center gap-2" key={setIndex}><span className="text-center text-sm font-bold text-white/40">{setIndex + 1}</span><NumberField decimals label="kg" value={set.weight} onChange={(value: string) => onSetChange(exerciseIndex, setIndex, "weight", value)} onBlur={onSetBlur} /><NumberField label="reps" value={set.reps} onChange={(value: string) => onSetChange(exerciseIndex, setIndex, "reps", value)} onBlur={onSetBlur} /><button className={`min-h-12 rounded-xl text-sm font-black ${set.completed ? "bg-accent text-ink" : "bg-white/[0.08]"}`} onClick={() => onCompleteSet(exerciseIndex, setIndex)}>{set.completed ? "Fatta" : "Tap"}</button></div>)}</div>
                <Feedback exercise={exercise} onFeedback={(field: "technique" | "rpe" | "rir" | "notes", value: string | number) => onFeedback(exerciseIndex, field, value)} />
              </Panel>
            );
          })}

          {notificationPermission !== "granted" && notificationPermission !== "unsupported" && <button className="min-h-12 w-full rounded-xl border border-accent/40 bg-accent/10 font-black text-accent" onClick={onEnableNotifications}>Attiva notifiche timer</button>}
          <div className="grid grid-cols-2 gap-3"><button className="min-h-14 rounded-xl bg-white/[0.08] font-bold text-white/65" onClick={onDiscard}>Scarta</button><button className={`min-h-14 rounded-xl font-black disabled:opacity-35 ${finishArmed ? "bg-accent text-ink" : "bg-white text-ink"}`} disabled={!completedSetCount(activeWorkout)} onClick={onFinish}>{finishArmed ? "Tocca ancora" : "Concludi"}</button></div>
          {finishArmed && <p className="-mt-1 text-center text-xs font-bold text-accent">Allenamento non completo: tocca ancora per chiuderlo.</p>}
        </>
      )}
    </section>
  );
}

function HistoryScreen({ history, onReopen }: { history: WorkoutSession[]; onReopen: (workout: WorkoutSession) => void }) {
  const [openId, setOpenId] = useState(history[0]?.id ?? "");
  if (!history.length) return <Empty title="Nessuno storico" body="Gli allenamenti conclusi resteranno qui, senza scadenza." />;
  return <section className="space-y-3">{history.map((workout) => <Panel key={workout.id}><button className="w-full text-left" onClick={() => setOpenId(openId === workout.id ? "" : workout.id)}><div className="flex justify-between gap-3"><div><h2 className="text-xl font-black">{workout.templateName}</h2><p className="mt-1 text-sm text-white/50">{formatDate(workout.startedAt)}</p></div><div className="text-right"><p className="font-black text-accent">{formatVolume(workoutVolume(workout))}</p><p className="text-xs text-white/45">{formatDuration(workout.durationSeconds ?? 0)}</p></div></div></button>{openId === workout.id && <div className="mt-4 space-y-3 border-t border-white/10 pt-3">{workout.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).map((exercise) => <div key={exercise.name}><div className="flex justify-between"><p className="font-bold">{exercise.name}</p><p className="text-sm font-black text-accent">{formatVolume(exerciseVolume(exercise))}</p></div><p className="mt-1 text-sm text-white/50">{exercise.sets.filter((set) => set.completed).map((set) => `${formatNumber(set.weight)}kg × ${set.reps}`).join(" · ")}</p></div>)}<button className="min-h-12 w-full rounded-xl border border-accent/40 bg-accent/10 font-black text-accent" onClick={() => onReopen(workout)}>Riapri e continua</button></div>}</Panel>)}</section>;
}

function ProgressScreen({ history, records, stats }: any) {
  const firstRecord = records[0];
  const timeline = firstRecord ? exerciseTimeline(history, firstRecord.exercise) : [];
  const rows = firstRecord ? progressionRows(history, firstRecord.exercise) : [];
  return <section className="space-y-5"><div className="grid grid-cols-2 gap-3"><Stat label="Allenamenti" value={String(stats.workoutsCompleted)} /><Stat label="Volume" value={formatVolume(stats.totalVolume)} /><Stat label="Ore" value={formatNumber(stats.hoursTrained)} /><Stat label="PR attuali" value={String(stats.currentPrs)} /></div>{firstRecord && <Panel><p className="text-sm text-white/55">Andamento esercizio</p><h2 className="mt-1 text-2xl font-black">{firstRecord.exercise}</h2><MiniChart points={timeline.map((item: any) => item.weight)} />{rows.length > 0 && <div className="mt-4 space-y-2">{rows.map((row) => <div className="rounded-xl bg-white/[0.05] p-3" key={row.date}><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{formatDate(row.date)}</p><Chip>{stateLabel(row.state)}</Chip></div><p className="mt-1 text-xs text-white/55">Prima {row.previousLoad} · Ora {row.currentLoad}</p><p className="mt-1 text-xs text-white/55">Reps: {row.previousReps} → {row.currentReps}</p><p className="mt-2 text-xs text-accent">{row.nextStep}</p></div>)}</div>}</Panel>}<section className="space-y-3">{records.map((record: any) => <Panel key={record.exercise}><div className="flex items-center justify-between"><h3 className="font-black">{record.exercise}</h3><Chip>PR</Chip></div><div className="mt-4 grid grid-cols-3 gap-2"><MiniMetric label="Peso" value={`${formatNumber(record.highestWeight)}kg`} /><MiniMetric label="1RM stim." value={`${formatNumber(record.estimatedOneRepMax)}kg`} /><MiniMetric label="Volume" value={formatVolume(record.bestVolume)} /></div></Panel>)}</section></section>;
}

function CoachScreen({ history, goals, progressions, daysAway }: any) {
  const last = history[0];
  const top = progressions[0];
  return <section className="space-y-5"><Panel highlight><p className="text-sm text-white/55">Coach</p><h2 className="mt-1 text-3xl font-black">{daysAway >= 10 ? "Rientro tranquillo." : "Pronto quando vuoi."}</h2><p className="mt-2 text-sm text-white/65">{daysAway >= 10 ? "La performance precedente è salva. Oggi conta ritrovare ritmo." : "Il piano è semplice: muoviti bene, poi progredisci."}</p></Panel>{top && <Panel><p className="text-sm text-white/55">Raccomandazione di oggi</p><h2 className="mt-1 text-2xl font-black text-accent">{top.exercise}</h2><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Stato" value={stateLabel(top.state)} /><MiniMetric label="Azione" value={top.label} /></div><p className="mt-3 text-sm text-white/65"><span className="font-black text-white">Perché: </span>{top.why}</p><p className="mt-2 text-sm text-white/65"><span className="font-black text-white">Cosa fare: </span>{top.doThis}</p><p className="mt-2 text-sm text-white/65"><span className="font-black text-white">Cosa evitare: </span>{top.avoid}</p></Panel>}<Panel><p className="font-black">Questa settimana</p><div className="mt-3 space-y-2">{goals.map((goal: string) => <p className="rounded-xl bg-white/[0.05] px-3 py-2 text-sm" key={goal}>{goal}</p>)}</div></Panel>{last?.coachSummary && <Panel><p className="font-black">Riepilogo ultimo allenamento</p><div className="mt-3 space-y-2">{last.coachSummary.map((line: string) => <p className="text-sm text-white/65" key={line}>{line}</p>)}</div></Panel>}<Panel><p className="font-black">Suggerimenti progressione</p><div className="mt-3 space-y-2">{progressions.slice(0, 5).map((item: any) => <div key={item.exercise} className="rounded-xl bg-white/[0.05] p-3"><p className="font-bold text-accent">{item.exercise}: {stateLabel(item.state)} · {item.label}</p><p className="mt-1 text-sm text-white/55">{item.detail}</p></div>)}</div></Panel></section>;
}

function SettingsScreen({ settings, importPreview, history, onSettings, onBackup, onImportFile, onConfirmImport, onCancelImport }: any) {
  return <section className="space-y-5"><Panel><h2 className="text-xl font-black">Autopilot</h2><Toggle label="Lascia scegliere allenamento e focus a LeanME" checked={settings.autopilot} onChange={(autopilot: boolean) => onSettings({ ...settings, autopilot })} /><Toggle label="Promemoria backup ogni 30 giorni" checked={settings.backupReminder} onChange={(backupReminder: boolean) => onSettings({ ...settings, backupReminder })} /></Panel><Panel><h2 className="text-xl font-black">Dati e backup</h2><div className="mt-4 grid grid-cols-2 gap-2"><MiniMetric label="Ultimo backup" value={settings.lastBackupAt ? formatDate(settings.lastBackupAt) : "Mai"} /><MiniMetric label="Allenamenti" value={String(history.length)} /></div><button className="mt-4 min-h-12 w-full rounded-xl bg-accent font-black text-ink" onClick={onBackup}>Esporta backup</button><label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-white/[0.08] font-bold"><input className="hidden" type="file" accept="application/json" onChange={(event: React.ChangeEvent<HTMLInputElement>) => onImportFile(event.target.files?.[0])} />Importa backup</label>{importPreview && <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-3"><p className="font-black text-accent">Anteprima backup</p><p className="mt-1 text-sm text-white/65">{formatDate(importPreview.backupDate)} · {importPreview.workoutCount} allenamenti · {importPreview.exerciseCount} esercizi · {importPreview.prCount} PR</p><div className="mt-3 grid grid-cols-2 gap-2"><button className="min-h-11 rounded-xl bg-accent font-black text-ink" onClick={onConfirmImport}>Importa</button><button className="min-h-11 rounded-xl bg-white/[0.08] font-bold" onClick={onCancelImport}>Annulla</button></div></div>}<p className="mt-4 text-center text-xs font-bold text-white/35">LeanME v{APP_VERSION} · aggiornamento allenamento</p></Panel></section>;
}

function Feedback({ exercise, onFeedback }: any) {
  const ratings: TechniqueRating[] = ["Perfetta", "Buona", "Instabile", "Scarsa"];
  return <div className="mt-4 space-y-3"><div><p className="mb-2 text-xs font-bold uppercase text-white/40">Tecnica</p><div className="grid grid-cols-4 gap-1">{ratings.map((rating) => <button key={rating} className={`min-h-10 rounded-lg text-xs font-bold ${exercise.feedback.technique === rating ? "bg-accent text-ink" : "bg-white/[0.07]"}`} onClick={() => onFeedback("technique", rating)}>{rating}</button>)}</div></div><Scale label="Difficoltà" value={exercise.feedback.rpe ?? 7} max={10} onChange={(value: number) => onFeedback("rpe", value)} /><RirScale value={exercise.feedback.rir ?? 2} onChange={(value: number) => onFeedback("rir", value)} /></div>;
}

function RirScale({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const values = [0, 1, 2, 3, 4, 5];
  return <div><p className="mb-2 text-xs font-bold uppercase text-white/40">RIR</p><div className="grid grid-cols-6 gap-1">{values.map((item) => <button className={`min-h-9 rounded-lg text-xs font-black ${value === item ? "bg-accent text-ink" : "bg-white/[0.07]"}`} key={item} onClick={() => onChange(item)}>{item === 5 ? "5+" : item}</button>)}</div></div>;
}

function FixedTimerBadge({ timer, remaining, onToggle, onAdjust, onClose }: any) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md px-3">
      <div className="rounded-2xl border border-accent/35 bg-[#07141a]/95 p-3 shadow-[0_0_34px_rgba(0,217,255,0.18)] backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-accent">Timer recupero</p>
            <p className="truncate text-xs text-white/55">{timer.exercise}</p>
          </div>
          <p className="text-4xl font-black tabular-nums text-white">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_2.5rem] gap-2">
          <button className="min-h-11 rounded-xl bg-white/[0.08] text-sm font-bold" onClick={onToggle}>{timer.running ? "Pausa" : "Avvia"}</button>
          <button className="min-h-11 rounded-xl bg-white/[0.08] text-sm font-bold" onClick={() => onAdjust(30)}>+30</button>
          <button className="min-h-11 rounded-xl bg-white/[0.08] text-sm font-bold" onClick={() => onAdjust(-30)}>-30</button>
          <button aria-label="Chiudi timer" className="min-h-11 rounded-xl bg-white/[0.08] text-lg font-black text-white/60" onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  );
}

function Panel({ children, highlight = false }: { children: React.ReactNode; highlight?: boolean }) {
  return <div className={`rounded-[1.35rem] border p-4 shadow-[0_18px_48px_rgba(0,0,0,0.22)] ${highlight ? "border-accent/25 bg-accent/[0.07]" : "border-white/10 bg-panel/90"}`}>{children}</div>;
}

function BottomNav({ active, setActive }: { active: Tab; setActive: (tab: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [{ id: "home", label: "Home" }, { id: "workout", label: "Allena" }, { id: "history", label: "Storico" }, { id: "progress", label: "Progressi" }, { id: "coach", label: "Coach" }, { id: "settings", label: "Impost." }];
  return <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-white/10 bg-ink/94 px-2 pt-2 backdrop-blur-xl"><div className="grid grid-cols-6 gap-1">{items.map((item) => <button className={`min-h-14 rounded-xl text-[0.65rem] font-bold ${active === item.id ? "bg-white text-ink" : "text-white/45"}`} key={item.id} onClick={() => setActive(item.id)}>{item.label}</button>)}</div></nav>;
}

function Segmented({ values, value, onChange }: { values: number[]; value: number; onChange: (value: number) => void }) {
  return <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/[0.06] p-1">{values.map((item) => <button className={`min-h-10 rounded-lg text-sm font-black ${item === value ? "bg-white text-ink" : "text-white/55"}`} key={item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function Scale({ label, value, onChange, max = 5 }: { label: string; value: number; onChange: (value: number) => void; max?: number }) {
  return <div><p className="mb-2 text-xs font-bold uppercase text-white/40">{label}</p><div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}>{Array.from({ length: max }, (_, index) => index + 1).map((item) => <button className={`min-h-9 rounded-lg text-xs font-black ${value === item ? "bg-white text-ink" : "bg-white/[0.07]"}`} key={item} onClick={() => onChange(item)}>{item}</button>)}</div></div>;
}

function NumberField({ decimals = false, label, value, onChange, onBlur }: { decimals?: boolean; label: string; value: number; onChange: (value: string) => void; onBlur: () => void }) {
  const [draft, setDraft] = useState(formatNumber(value));

  useEffect(() => {
    setDraft(formatNumber(value));
  }, [value]);

  function handleChange(raw: string) {
    const pattern = decimals ? /^\d*([,.]\d{0,2})?$/ : /^\d*$/;
    if (!pattern.test(raw)) return;
    setDraft(raw);
    if (!raw || /[,.]$/.test(raw)) return;
    const parsed = parseLocaleNumber(raw);
    if (Number.isFinite(parsed)) onChange(String(parsed));
  }

  function handleBlur() {
    const parsed = parseLocaleNumber(draft);
    setDraft(Number.isFinite(parsed) ? formatNumber(parsed) : formatNumber(value));
    if (Number.isFinite(parsed)) onChange(String(parsed));
    onBlur();
  }

  return <label className="relative block"><input className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-2 pb-1 pt-4 text-center font-black outline-none focus:border-accent" inputMode={decimals ? "decimal" : "numeric"} value={draft} onBlur={handleBlur} onChange={(event) => handleChange(event.target.value)} /><span className="pointer-events-none absolute left-0 right-0 top-1 text-center text-[0.6rem] font-bold uppercase text-white/35">{label}</span></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button className="mt-4 flex w-full items-center justify-between rounded-xl bg-white/[0.06] p-3 text-left" onClick={() => onChange(!checked)}><span className="font-bold">{label}</span><span className={`h-7 w-12 rounded-full p-1 ${checked ? "bg-accent" : "bg-white/15"}`}><span className={`block h-5 w-5 rounded-full bg-ink transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}

function Stat({ label, value }: any) { return <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><p className="text-sm text-white/50">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function MiniMetric({ label, value }: any) { return <div className="rounded-xl bg-white/[0.06] p-3"><p className="text-[0.65rem] font-bold uppercase text-white/35">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
function Chip({ children }: { children: React.ReactNode }) { return <span className="whitespace-nowrap rounded-lg bg-accent/15 px-3 py-1 text-xs font-black text-accent">{children}</span>; }
function Empty({ title, body }: any) { return <div className="flex min-h-[55vh] items-center justify-center text-center"><div><h2 className="text-2xl font-black">{title}</h2><p className="mt-2 max-w-xs text-sm text-white/50">{body}</p></div></div>; }
function Loading() { return <main className="flex min-h-screen items-center justify-center bg-ink text-white"><p className="font-black">Carico LeanME</p></main>; }
function MiniChart({ points }: { points: number[] }) { const max = Math.max(...points, 1); return <div className="mt-4 flex h-28 items-end gap-2 rounded-xl bg-white/[0.04] p-3">{points.map((point, index) => <div key={index} className="flex-1 rounded-t bg-accent" style={{ height: `${Math.max(8, (point / max) * 100)}%` }} />)}</div>; }

function getTimerRemaining(timer: RestTimer | null, currentTime: number) { if (!timer) return 0; return timer.running ? Math.max(0, Math.ceil((timer.endTime - currentTime) / 1000)) : Math.max(0, timer.pausedRemainingSeconds); }
function formatDate(input: string) { return dateFormat.format(new Date(input)); }
function formatDuration(seconds: number) { const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
function formatVolume(volume: number) { return volume >= 1000 ? `${formatNumber(volume / 1000)}k kg` : `${formatNumber(volume)} kg`; }
function formatNumber(value: number) { return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(value); }
function parseLocaleNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
}
function daysBetween(a: string, b: string) { return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000); }
function titleFor(tab: Tab) { return { home: "Home", workout: "Allenamento", history: "Storico", progress: "Progressi", coach: "Coach", settings: "Impostazioni" }[tab]; }
function stateLabel(state: string) { return { BUILDING: "Costruzione", CONSOLIDATING: "Consolida", READY: "Pronto", NEW_LOAD: "Nuovo carico" }[state] ?? state; }

function progressionRows(history: WorkoutSession[], exerciseName: string) {
  const sessions = [...history]
    .filter((workout) => workout.completedAt)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((workout) => {
      const exercise = workout.exercises.find((item) => item.name === exerciseName);
      const sets = exercise?.sets.filter((set) => set.completed) ?? [];
      if (!exercise || !sets.length) return null;
      return {
        date: workout.startedAt,
        state: exercise.progressionState ?? "BUILDING",
        load: Math.max(...sets.map((set) => set.weight)),
        reps: sets.map((set) => set.reps).join("/")
      };
    })
    .filter(Boolean) as Array<{ date: string; state: string; load: number; reps: string }>;

  return sessions.slice(-4).map((session, index, list) => {
    const previous = list[index - 1];
    return {
      date: session.date,
      state: session.state,
      previousLoad: previous ? `${formatNumber(previous.load)}kg` : "n/d",
      currentLoad: `${formatNumber(session.load)}kg`,
      previousReps: previous?.reps ?? "n/d",
      currentReps: session.reps,
      nextStep: stateLabel(session.state) === "Pronto" ? "Valuta il prossimo carico solo se ti senti stabile." : "Mantieni qualità, controllo e margine."
    };
  });
}

async function notifyTimerDone(exercise: string) {
  if ("vibrate" in navigator) navigator.vibrate([250, 100, 250]);
  if ("Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Recupero finito", { body: `${exercise}: pronto per la prossima serie.`, icon: "/icon-192.png", badge: "/icon-192.png", tag: "leanme-rest" });
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}
