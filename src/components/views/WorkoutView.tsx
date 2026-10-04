'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '@/lib/store';
import { soundFx } from '@/lib/sound-fx';
import { WorkoutLog, WorkoutExercise, Visibility } from '@/types';
import {
  Dumbbell,
  Plus,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Trash2,
  Activity,
  Heart,
  Calendar,
  Play,
  Pause,
  Square,
  Compass,
  Trophy,
  Zap,
  RotateCcw,
  Footprints,
  MapPin,
  Check
} from 'lucide-react';

const WORKOUT_TYPES: WorkoutLog['type'][] = [
  'Running',
  'Strength',
  'Cardio',
  'Walking',
  'Cycling',
  'Mobility',
  'Yoga',
  'Bodyweight',
  'Gym',
  'Sports'
];

interface GuidedRun {
  id: string;
  title: string;
  coach: string;
  distanceKm: number;
  durationMin: number;
  description: string;
  tag: string;
}

const NRC_GUIDED_RUNS: GuidedRun[] = [
  {
    id: 'gr_first5k',
    title: 'First 5K with Coach Bennett',
    coach: 'Coach Bennett',
    distanceKm: 5.0,
    durationMin: 32,
    description: 'Find your rhythm, celebrate every kilometer, and learn pacing from the NRC head coach.',
    tag: 'Beginner / 5K'
  },
  {
    id: 'gr_morning3k',
    title: 'Morning Sunshine 3K Shakeout',
    coach: 'Coach Cory',
    distanceKm: 3.0,
    durationMin: 18,
    description: 'Quick morning energy booster. Shake off yesterday’s fatigue and wake up your legs.',
    tag: 'Quick Wakeup'
  },
  {
    id: 'gr_speed_intervals',
    title: 'Tempo & Speed Intervals',
    coach: 'Coach Shalane',
    distanceKm: 4.5,
    durationMin: 25,
    description: 'Alternating 400m intervals at 5K pace with 90s recovery jogs to build athletic power.',
    tag: 'Speedwork'
  },
  {
    id: 'gr_10k_endurance',
    title: '10K Long Run Mastery',
    coach: 'Coach Chris',
    distanceKm: 10.0,
    durationMin: 58,
    description: 'Steady aerobic base building. Calm breathing, sustained cadence, and strong finish.',
    tag: 'Endurance'
  }
];

export function WorkoutView() {
  const { currentUser, partnerUser, workouts, addWorkout } = useLifeOS();

  // Mode: if Satvika, default directly to Nike Run Club!
  const isSatvikaUser = currentUser.id === 'user_satvika';
  const [activeMode, setActiveMode] = useState<'nrc' | 'strength'>(
    isSatvikaUser ? 'nrc' : 'strength'
  );

  // ---------------- NIKE RUN CLUB STATE ----------------
  const [runState, setRunState] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [runSeconds, setRunSeconds] = useState(0);
  const [runDistance, setRunDistance] = useState(0.00);
  const [runType, setRunType] = useState<'OUTDOOR' | 'TREADMILL'>('OUTDOOR');
  const [selectedGuidedRun, setSelectedGuidedRun] = useState<GuidedRun | null>(NRC_GUIDED_RUNS[0]);
  const [shoeGear, setShoeGear] = useState('Nike Air Zoom Pegasus 40');
  const [runNotes, setRunNotes] = useState('');
  const [justFinishedRun, setJustFinishedRun] = useState<WorkoutLog | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Running Live Stopwatch & simulated distance accumulation
  useEffect(() => {
    if (runState === 'running') {
      timerRef.current = setInterval(() => {
        setRunSeconds(prev => {
          const next = prev + 1;
          // Approximate natural runner pace ~ 5 min 30 sec per km = ~0.003 km/sec
          setRunDistance(d => Number((d + 0.00305).toFixed(2)));
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runState]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins % 60).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const calculatePace = (sec: number, dist: number) => {
    if (dist <= 0 || sec <= 0) return `0'00"`;
    const secPerKm = sec / dist;
    const paceMins = Math.floor(secPerKm / 60);
    const paceSecs = Math.floor(secPerKm % 60);
    return `${paceMins}'${String(paceSecs).padStart(2, '0')}"`;
  };

  const handleStartRun = () => {
    setRunState('running');
    soundFx.playEncouragementChime();
  };

  const handlePauseRun = () => {
    setRunState('paused');
  };

  const handleResumeRun = () => {
    setRunState('running');
  };

  const handleFinishRun = () => {
    setRunState('idle');
    const finalSeconds = runSeconds || 60;
    const finalMinutes = Math.max(1, Math.round(finalSeconds / 60));
    const finalDistance = Number(runDistance.toFixed(2)) || (selectedGuidedRun ? selectedGuidedRun.distanceKm : 3.0);
    const finalPace = calculatePace(finalSeconds, finalDistance);
    const estimatedCalories = Math.round(finalDistance * 65);

    const loggedRun: Omit<WorkoutLog, 'id' | 'spaceId' | 'userId' | 'date'> = {
      type: 'Running',
      durationMinutes: finalMinutes,
      distanceKm: finalDistance,
      pacePerKm: finalPace,
      avgHeartRate: 148,
      caloriesBurned: estimatedCalories,
      runType,
      guidedRunName: selectedGuidedRun ? selectedGuidedRun.title : undefined,
      exercises: [],
      notes: runNotes.trim() || (selectedGuidedRun ? `NRC Guided Run with ${selectedGuidedRun.coach} • Shoe: ${shoeGear}` : `Solo ${runType.toLowerCase()} run • Shoe: ${shoeGear}`),
      visibility: 'SHARED'
    };

    addWorkout(loggedRun);
    soundFx.playTaskCompleteChime();

    setJustFinishedRun({
      ...loggedRun,
      id: 'recent',
      spaceId: '',
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0]
    });

    // Reset run HUD
    setRunSeconds(0);
    setRunDistance(0);
    setRunNotes('');
  };

  // Filter running workouts for Satvika / runners
  const runningLogs = workouts.filter(w => w.type === 'Running' || w.distanceKm);

  // ---------------- GENERAL GYM / STRENGTH STATE ----------------
  const [type, setType] = useState<WorkoutLog['type']>('Strength');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('SHARED');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    { name: 'Dumbbell Bench Press', sets: 4, reps: 10, weightKg: 24 },
    { name: 'Romanian Deadlift', sets: 3, reps: 12, weightKg: 30 }
  ]);
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);
  const [newExWeight, setNewExWeight] = useState(20);
  const [aiRoutineModal, setAiRoutineModal] = useState(false);

  const addExerciseRow = () => {
    if (!newExName.trim()) return;
    setExercises(prev => [...prev, {
      name: newExName.trim(),
      sets: newExSets,
      reps: newExReps,
      weightKg: newExWeight
    }]);
    setNewExName('');
  };

  const removeExerciseRow = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    addWorkout({
      type,
      durationMinutes: duration,
      exercises,
      notes: notes.trim() || undefined,
      visibility
    });
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
              Live Connected Movement
            </span>
            <span className="text-xs text-muted-foreground">• Real-time Sync Active</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            {activeMode === 'nrc' ? 'Satvika’s Nike Run Club' : 'Movement & Gym Training'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeMode === 'nrc'
              ? 'GPS run tracking, audio coaching, pace monitoring, and automatic cross-device sync.'
              : 'Log gym sets, progressive overload, and resistance workouts.'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/60 border border-border/80">
          <button
            onClick={() => setActiveMode('nrc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeMode === 'nrc'
                ? 'bg-black text-[#D4FF00] shadow-md border border-[#D4FF00]/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Footprints className="h-4 w-4" />
            <span>Nike Run Club</span>
          </button>
          <button
            onClick={() => setActiveMode('strength')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'strength'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>Strength & Gym</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. NIKE RUN CLUB INTERFACE (CUSTOM DESIGN FOR SATVIKA)   */}
      {/* ======================================================== */}
      {activeMode === 'nrc' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Main NRC Live Running HUD */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border-2 border-zinc-800 text-white p-6 sm:p-8 shadow-2xl">
            {/* Background NRC Ambience Glow */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#D4FF00]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#D4FF00] text-black flex items-center justify-center font-black text-xl italic shadow-[0_0_20px_rgba(212,255,0,0.4)]">
                  NRC
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
                    <span>Satvika&apos;s Run Session</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-[#D4FF00] font-mono">
                      {runState === 'running' ? 'LIVE RUNNING' : runState === 'paused' ? 'PAUSED' : 'READY'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {selectedGuidedRun ? selectedGuidedRun.title : 'Open Run'} &bull; {shoeGear}
                  </p>
                </div>
              </div>

              {/* Outdoor vs Treadmill Toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                <button
                  disabled={runState === 'running'}
                  onClick={() => setRunType('OUTDOOR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    runType === 'OUTDOOR' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Outdoor GPS
                  </span>
                </button>
                <button
                  disabled={runState === 'running'}
                  onClick={() => setRunType('TREADMILL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    runType === 'TREADMILL' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-3 w-3" /> Treadmill
                  </span>
                </button>
              </div>
            </div>

            {/* Giant Live Distance Display (NRC Signature Style) */}
            <div className="py-8 text-center space-y-2">
              <div className="text-[72px] sm:text-[96px] font-black tracking-tighter leading-none text-white font-mono select-none drop-shadow-md">
                {runDistance.toFixed(2)}
              </div>
              <div className="text-sm font-black uppercase tracking-[0.3em] text-[#D4FF00]">
                Kilometers
              </div>
            </div>

            {/* Live Metrics Grid (Pace, Time, HR/Calories) */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Pace</span>
                <span className="text-lg sm:text-2xl font-black text-white">
                  {calculatePace(runSeconds, runDistance)}
                </span>
                <span className="text-[9px] text-zinc-500 block">/KM</span>
              </div>

              <div className="space-y-0.5 border-x border-zinc-800 px-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Duration</span>
                <span className="text-lg sm:text-2xl font-black text-white">
                  {formatTimer(runSeconds)}
                </span>
                <span className="text-[9px] text-zinc-500 block">TIME</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Heart / Burn</span>
                <span className="text-lg sm:text-2xl font-black text-[#D4FF00]">
                  {Math.round(runDistance * 65)}
                </span>
                <span className="text-[9px] text-zinc-500 block">EST. KCAL</span>
              </div>
            </div>

            {/* Live Controls */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {runState === 'idle' && (
                <button
                  onClick={handleStartRun}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#D4FF00] hover:bg-[#c2eb00] text-black font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(212,255,0,0.5)] active:scale-95 transition-all"
                >
                  <Play className="h-5 w-5 fill-black" />
                  <span>Start Run</span>
                </button>
              )}

              {runState === 'running' && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handlePauseRun}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 active:scale-95 transition-all"
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </button>

                  <button
                    onClick={handleFinishRun}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Square className="h-4 w-4 fill-white" />
                    <span>Finish Run</span>
                  </button>
                </div>
              )}

              {runState === 'paused' && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleResumeRun}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-full bg-[#D4FF00] text-black font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.4)] active:scale-95 transition-all"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={handleFinishRun}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Square className="h-4 w-4 fill-white" />
                    <span>Finish Run</span>
                  </button>
                </div>
              )}
            </div>

            {/* Victory Banner when finished */}
            {justFinishedRun && (
              <div className="mt-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-between text-xs animate-in zoom-in-95">
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-5 w-5 text-[#D4FF00]" />
                  <div>
                    <span className="font-extrabold text-white block">Run Completed & Synchronized! 🔥</span>
                    <span>Logged {justFinishedRun.distanceKm} KM in {justFinishedRun.durationMinutes} mins. Shanmukh&apos;s device notified!</span>
                  </div>
                </div>
                <button
                  onClick={() => setJustFinishedRun(null)}
                  className="px-3 py-1 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 text-[11px] font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Guided Runs & Weekly Milestones Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Guided Runs Selector */}
            <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D4FF00] dark:text-[#D4FF00] text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-foreground">NRC Audio Guided Runs</h3>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Select a Workout</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NRC_GUIDED_RUNS.map((gr) => {
                  const isSelected = selectedGuidedRun?.id === gr.id;
                  return (
                    <div
                      key={gr.id}
                      onClick={() => setSelectedGuidedRun(gr)}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all text-left space-y-2 ${
                        isSelected
                          ? 'border-[#D4FF00] bg-[#D4FF00]/10 shadow-sm'
                          : 'border-border/70 bg-card hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          {gr.tag}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-primary">
                          {gr.distanceKm} KM &bull; {gr.durationMin}m
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-foreground">{gr.title}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{gr.description}</p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-muted-foreground font-medium">Coach: {gr.coach}</span>
                        {isSelected && (
                          <span className="text-[#D4FF00] dark:text-[#D4FF00] text-emerald-600 font-extrabold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Selected
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Satvika's Weekly Mileage Target & Gear */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Satvika’s Weekly Target</h3>
                  <span className="text-xs font-mono font-extrabold text-emerald-500">25.0 KM Goal</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-mono">18.4 / 25.0 KM (74%)</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: '74%' }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Only 6.6 KM left to hit this week&apos;s goal!
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <span className="text-xs font-bold text-foreground block">Current Running Shoes</span>
                  <input
                    type="text"
                    value={shoeGear}
                    onChange={(e) => setShoeGear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground"
                  />
                </div>
              </div>

              {/* Running History Feed */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Satvika&apos;s Completed Runs
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {runningLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No runs recorded yet. Start your first run above!</p>
                  ) : (
                    runningLogs.map((run) => (
                      <div key={run.id} className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-foreground">{run.guidedRunName || 'Run Session'}</span>
                          <span className="text-emerald-500 font-mono font-extrabold">{run.distanceKm || 3.0} KM</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Pace: {run.pacePerKm || `5'30"`}</span>
                          <span>{run.durationMinutes} mins</span>
                          <span>{run.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GENERAL STRENGTH & GYM TRAINING INTERFACE             */}
      {/* ======================================================== */}
      {activeMode === 'strength' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Log New Workout Form */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <span>Log Gym / Strength Session</span>
              </h2>
              <button
                onClick={() => setAiRoutineModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Routine Generator</span>
              </button>
            </div>

            <form onSubmit={handleLogWorkout} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WorkoutLog['type'])}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as Visibility)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="SHARED">Shared with Partner</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </div>

              {/* Exercises Table */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <span className="font-bold text-foreground block">Exercises & Weights:</span>

                <div className="space-y-2">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <span className="font-bold text-foreground">{ex.name}</span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{ex.sets} sets &times; {ex.reps} reps</span>
                        {ex.weightKg && <span className="font-semibold text-primary">{ex.weightKg} kg</span>}
                        <button
                          type="button"
                          onClick={() => removeExerciseRow(i)}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Exercise Row Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Exercise Name"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    className="col-span-2 px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
                  />
                  <input
                    type="number"
                    placeholder="Sets"
                    value={newExSets}
                    onChange={(e) => setNewExSets(parseInt(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={newExReps}
                    onChange={(e) => setNewExReps(parseInt(e.target.value))}
                    className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="Kg"
                      value={newExWeight}
                      onChange={(e) => setNewExWeight(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
                    />
                    <button
                      type="button"
                      onClick={addExerciseRow}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Session Notes</label>
                <textarea
                  rows={2}
                  placeholder="How did energy and recovery feel?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-95"
                >
                  Save Workout Log
                </button>
              </div>
            </form>
          </div>

          {/* Recent Workout Logs */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>All Workouts Feed</span>
            </h2>

            <div className="space-y-3">
              {workouts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-border bg-card text-muted-foreground text-xs">
                  No workouts recorded yet.
                </div>
              ) : (
                workouts.map(wo => (
                  <div key={wo.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {wo.type}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{wo.durationMinutes} mins</span>
                    </div>
                    {wo.distanceKm && (
                      <div className="text-xs font-mono font-bold text-primary">
                        Distance: {wo.distanceKm} KM &bull; Pace: {wo.pacePerKm || `5'30"`}
                      </div>
                    )}
                    <div className="space-y-1 text-xs">
                      {wo.exercises?.map((ex, i) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>{ex.name}</span>
                          <span>{ex.sets}&times;{ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}</span>
                        </div>
                      ))}
                    </div>
                    {wo.notes && (
                      <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/50">
                        &ldquo;{wo.notes}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* AI Routine Builder Modal */}
      {aiRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-bold text-foreground">AI Workout Generator</h3>
              </div>
              <button onClick={() => setAiRoutineModal(false)} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Synthesizing routine for <span className="font-bold text-foreground">{currentUser.name}</span> based on equipment: <span className="font-semibold text-primary">{currentUser.availableEquipment}</span> and target duration: <span className="font-semibold text-primary">{currentUser.workoutDuration} mins</span>.
              </p>

              <div className="p-4 rounded-2xl bg-secondary/40 space-y-2 mt-3">
                <span className="font-bold text-foreground">Suggested Routine: Upper Body Stability & Power</span>
                <ul className="space-y-1 text-muted-foreground">
                  <li>&bull; Warm-up: 5 mins arm circles, cat-cow, band pull-aparts</li>
                  <li>&bull; Dumbbell Incline Press: 4 sets &times; 10 reps</li>
                  <li>&bull; Single-Arm Bent Over Rows: 4 sets &times; 12 reps</li>
                  <li>&bull; Overhead Neutral Grip Press: 3 sets &times; 10 reps</li>
                  <li>&bull; Deadbugs & Planks: 3 sets &times; 45s</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAiRoutineModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Adopt Routine
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
