'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { AIService, NextActionResult } from '@/lib/ai-service';
import { SpecialMode } from '@/types';
import {
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  Circle,
  Flame,
  Droplets,
  Dumbbell,
  GraduationCap,
  Sparkles,
  Heart,
  ArrowRight,
  Send,
  Zap,
  Shield,
  Coffee,
  Plus,
  Compass,
  AlertTriangle,
  Plane,
  RotateCcw,
  Camera,
  Layers,
  HelpCircle,
  TrendingUp,
  Smile
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { id: 'WAKE', label: 'Wake Up', icon: Sun, done: true },
  { id: 'CHECKIN', label: 'Check-in', icon: Smile, done: true },
  { id: 'PLAN', label: 'Plan', icon: Zap, done: true },
  { id: 'TASKS', label: 'Tasks', icon: CheckCircle2, done: true },
  { id: 'STUDY', label: 'Study', icon: GraduationCap, done: true },
  { id: 'FOOD', label: 'Food', icon: Coffee, done: true },
  { id: 'WATER', label: 'Water', icon: Droplets, done: false },
  { id: 'WORKOUT', label: 'Workout', icon: Dumbbell, done: true },
  { id: 'EVENING', label: 'Review', icon: Moon, done: false },
  { id: 'TOMORROW', label: 'Tomorrow', icon: Sparkles, done: false },
];

export function HomeView() {
  const {
    currentUser,
    partnerUser,
    tasks,
    habits,
    waterIntake,
    sleepLogs,
    workouts,
    specialMode,
    setSpecialMode,
    todaysTopThree,
    setTodaysTopThree,
    oneThingId,
    setOneThingId,
    toggleTask,
    toggleHabit,
    addWater,
    sendEncouragement,
    openLightbox,
    setActiveView
  } = useLifeOS();

  const [aiNextAction, setAiNextAction] = useState<NextActionResult | null>(null);
  const [encouragementSent, setEncouragementSent] = useState(false);
  const [nightModeOpen, setNightModeOpen] = useState(false);
  const [nightReflection, setNightReflection] = useState({ well: '', notWell: '', feeling: 'Accomplished and grounded' });

  // Today's accessible tasks
  const todayTasks = tasks.filter(t => t.creatorId === currentUser.id || t.visibility === 'SHARED');
  const completedTasks = todayTasks.filter(t => t.status === 'COMPLETED');
  const taskPct = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
  
  const todayHabits = habits.filter(h => h.userId === currentUser.id);
  const latestSleep = sleepLogs.find(s => s.userId === currentUser.id);
  const todayWorkout = workouts.find(w => w.userId === currentUser.id);

  // Partner's shared items only (Strict Privacy)
  const partnerSharedTasks = tasks.filter(t => t.creatorId === partnerUser?.id && t.visibility === 'SHARED');
  const partnerWorkout = workouts.find(w => w.userId === partnerUser?.id && w.visibility === 'SHARED');

  const oneThingTask = tasks.find(t => t.id === oneThingId);
  const topThreeTasks = tasks.filter(t => todaysTopThree.includes(t.id));

  const handleNextActionClick = () => {
    const action = AIService.getWhatShouldIDoNow(currentUser, tasks);
    setAiNextAction(action);
  };

  const handleQuickEncourage = (emoji: string, text: string) => {
    sendEncouragement(text, emoji);
    setEncouragementSent(true);
    setTimeout(() => setEncouragementSent(false), 2500);
  };

  const currentDateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* 1. Core Daily Lifecycle Stepper */}
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-primary" /> Daily Experience Lifecycle
          </span>
          <span className="text-muted-foreground font-semibold">
            {LIFECYCLE_STEPS.filter(s => s.done).length} / {LIFECYCLE_STEPS.length} Stages Active
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    step.done
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{step.label}</span>
                </div>
                {idx < LIFECYCLE_STEPS.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Mode Selector Bar (Normal, Weekend, Rest Day, Travel, Exam) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">Active Mode:</span>
          <div className="flex items-center rounded-xl bg-card p-0.5 border border-border">
            {(['NORMAL', 'WEEKEND', 'REST_DAY', 'TRAVEL', 'EXAM'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSpecialMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  specialMode === mode
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'NORMAL' && 'Standard'}
                {mode === 'WEEKEND' && 'Weekend'}
                {mode === 'REST_DAY' && 'Rest Day'}
                {mode === 'TRAVEL' && 'Travel'}
                {mode === 'EXAM' && 'Exam Mode'}
              </button>
            ))}
          </div>
        </div>

        {specialMode === 'REST_DAY' && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold italic">
            🌱 Rest is essential recovery. Workout expectations gently adapted.
          </span>
        )}
        {specialMode === 'TRAVEL' && (
          <span className="text-primary font-semibold italic">
            ✈️ Travel Mode active: Habit streaks safely frozen.
          </span>
        )}
        {specialMode === 'EXAM' && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold italic">
            📚 Exam Mode: Revision countdown prioritized.
          </span>
        )}
      </div>

      {/* 3. Header Greeting & Morning Briefing Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-br from-card via-card to-primary/5 border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sun className="h-4 w-4" />
            <span>{currentDateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed pt-1">
            <strong>AI Daily Briefing:</strong> You slept 7h 42m with target wake {currentUser.wakeTargetTime}. You have an engineering problem set due in 3 days, and your morning workout is logged. We suggest completing your Kinematics derivations before evening reconnect.
          </p>
        </div>

        {/* Daily Progress Gauge */}
        <div className="flex items-center gap-4 bg-background/80 border border-border/60 p-4 rounded-2xl backdrop-blur-xs shrink-0">
          <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary/10">
            <span className="font-extrabold text-lg text-primary">{taskPct}%</span>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Daily Progress</div>
            <div className="text-sm font-bold text-foreground">
              {completedTasks.length} / {todayTasks.length} tasks completed
            </div>
          </div>
        </div>
      </div>

      {/* 4. "ONE THING THAT MATTERS" & "TODAY'S 3" SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ONE THING THAT MATTERS */}
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> One Thing That Matters
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Today</span>
          </div>
          {oneThingTask ? (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">{oneThingTask.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{oneThingTask.description}</p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="font-semibold text-primary">{oneThingTask.category}</span>
                <button
                  onClick={() => toggleTask(oneThingTask.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${oneThingTask.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'}`}
                >
                  {oneThingTask.status === 'COMPLETED' ? 'Completed ✓' : 'Complete'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Select your core priority for the day.</p>
          )}
        </div>

        {/* TODAY'S TOP 3 */}
        <div className="md:col-span-2 rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Today&apos;s 3 Core Focus Items
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold">Prevents task overload</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {topThreeTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                  task.status === 'COMPLETED'
                    ? 'border-border/40 bg-secondary/30 line-through text-muted-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground shadow-2xs'
                }`}
              >
                <div className="font-bold truncate">{task.title}</div>
                <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                  <span>{task.category}</span>
                  <span>{task.dueTime || 'Today'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Intelligent "WHAT SHOULD I DO NOW?" Highlight */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>AI Context Engine</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">What should I do right now?</h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Analyzes current time, energy, deadlines, and remaining priorities to recommend the optimal next action.
            </p>
          </div>

          <button
            onClick={handleNextActionClick}
            className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 hover:opacity-95 transition-all active:scale-95 shrink-0"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>What Should I Do Now?</span>
          </button>
        </div>

        {aiNextAction && (
          <div className="mt-4 pt-4 border-t border-primary/20 animate-in fade-in-50 duration-300">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase">Recommended Next Block</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  ~{aiNextAction.estimatedMinutes} mins
                </span>
              </div>
              <p className="text-base font-bold text-foreground mt-1">
                {aiNextAction.actionTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {aiNextAction.rationale}
              </p>

              <div className="mt-3 pt-3 border-t border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Then:</span>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-foreground">
                  {aiNextAction.upcomingSequence.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="bg-secondary/70 px-2.5 py-1 rounded-lg">{step}</span>
                      {idx < aiNextAction.upcomingSequence.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Vital Progress Cards with Quick Break System */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Hydration */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" /> Water
            </span>
            <button
              onClick={() => addWater(250)}
              title="Add 250ml"
              className="p-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="text-xl font-extrabold">
            {(waterIntake / 1000).toFixed(2)}L
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {(currentUser.waterTargetMl / 1000).toFixed(1)}L
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((waterIntake / currentUser.waterTargetMl) * 100))}%` }}
            />
          </div>
        </div>

        {/* Study Focus */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" /> Study
            </span>
            <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded-sm">Today</span>
          </div>
          <div className="text-xl font-extrabold">
            2h 20m
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {currentUser.dailyStudyTargetHours || 4}h
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '58%' }} />
          </div>
        </div>

        {/* Workout with Photo Proof Preview */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" /> Workout
            </span>
            {todayWorkout?.photoUrl && (
              <button
                onClick={() => openLightbox({ url: todayWorkout.photoUrl!, title: 'Workout Proof Photo' })}
                className="text-[10px] text-emerald-500 hover:underline flex items-center gap-0.5"
              >
                <Camera className="h-3 w-3" /> Proof
              </button>
            )}
          </div>
          <div className="text-xl font-extrabold">
            {todayWorkout ? `${todayWorkout.durationMinutes}m` : 'Rest / Due'}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {todayWorkout ? `${todayWorkout.type} Logged` : currentUser.preferredWorkoutTime || 'Evening block'}
          </p>
        </div>

        {/* Sleep */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
            <span className="flex items-center gap-1.5">
              <Moon className="h-4 w-4" /> Sleep
            </span>
            <span className="text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded-sm">7h 42m</span>
          </div>
          <div className="text-xl font-extrabold">
            {latestSleep ? `${Math.floor(latestSleep.durationMinutes / 60)}h ${latestSleep.durationMinutes % 60}m` : '7h 42m'}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Target: {currentUser.sleepTargetHours}h &bull; Wake: {currentUser.wakeTargetTime}
          </p>
        </div>

      </div>

      {/* 7. Night Mode Questionnaire ("How Did Today Go?") */}
      <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-bold text-foreground">Night Reflection: How Did Today Go?</h3>
          </div>
          <button
            onClick={() => setNightModeOpen(!nightModeOpen)}
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            {nightModeOpen ? 'Hide Reflection' : 'Open Reflection'}
          </button>
        </div>

        {nightModeOpen && (
          <div className="space-y-4 pt-2 border-t border-purple-500/20 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground">What went well today?</label>
                <input
                  type="text"
                  placeholder="e.g. Mastered Euler-Lagrange equations, stayed hydrated"
                  value={nightReflection.well}
                  onChange={(e) => setNightReflection({ ...nightReflection, well: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">What needed more attention?</label>
                <input
                  type="text"
                  placeholder="e.g. Reading habit, winding down before 10:30 PM"
                  value={nightReflection.notWell}
                  onChange={(e) => setNightReflection({ ...nightReflection, notWell: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-muted-foreground italic">
                AI Evening Review: 8/10 tasks done &bull; 2h 20m study completed &bull; Sleep target 8h.
              </span>
              <button
                onClick={() => {
                  alert('Reflection recorded! Tomorrow plan prepared.');
                  setNightModeOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90"
              >
                Save Reflection & Prepare Tomorrow
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 8. Partner Awareness — Strict Privacy Enclosure */}
      {partnerUser && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
              <h3 className="text-base font-bold text-foreground">
                How {partnerUser.name.split(' ')[0]} is doing
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" /> Only explicitly shared information shown
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Shared Tasks</span>
              <div className="text-lg font-bold text-foreground">
                {partnerSharedTasks.filter(t => t.status === 'COMPLETED').length} / {partnerSharedTasks.length} Completed
              </div>
              <p className="text-xs text-muted-foreground">
                Active on bio-informatics design & study sprint
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Workout & Wellness</span>
              <div className="text-lg font-bold text-foreground">
                {partnerWorkout ? `${partnerWorkout.type} Logged` : 'Evening Mobility Scheduled'}
              </div>
              <p className="text-xs text-muted-foreground">
                Hydration target on track
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2.5">
              <span className="text-xs font-semibold text-muted-foreground">Send Encouragement</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickEncourage('❤️', "You've got this! Thinking of you.")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-rose-500/10 hover:text-rose-500 border border-border font-medium transition-colors"
                >
                  ❤️ Got this
                </button>
                <button
                  onClick={() => handleQuickEncourage('☕', 'Take a gentle breath & tea break.')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-amber-500/10 hover:text-amber-500 border border-border font-medium transition-colors"
                >
                  ☕ Break
                </button>
                <button
                  onClick={() => handleQuickEncourage('🌟', 'So proud of your dedication!')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-indigo-500/10 hover:text-indigo-500 border border-border font-medium transition-colors"
                >
                  🌟 Proud
                </button>
              </div>
              {encouragementSent && (
                <p className="text-xs text-emerald-500 font-semibold animate-in fade-in">
                  Encouragement sent to {partnerUser.name.split(' ')[0]}!
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
