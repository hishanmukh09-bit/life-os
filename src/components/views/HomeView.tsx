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
  Users,
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
  Heart,
  Smile,
  Calendar,
  X
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
    exams,
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
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);

  const todayTasks = tasks.filter(t => t.creatorId === currentUser.id || t.visibility === 'SHARED');
  const completedTasks = todayTasks.filter(t => t.status === 'COMPLETED');
  const taskPct = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
  
  const todayHabits = habits.filter(h => h.userId === currentUser.id);
  const latestSleep = sleepLogs.find(s => s.userId === currentUser.id);
  const todayWorkout = workouts.find(w => w.userId === currentUser.id);

  const handleAskCoach = (q: string) => {
    const query = q || coachQuestion;
    if (!query.trim()) return;
    const ans = AIService.askAICoach(
      currentUser.name.split(' ')[0],
      partnerUser ? partnerUser.name.split(' ')[0] : 'Partner',
      query,
      tasks,
      exams,
      waterIntake,
      latestSleep?.durationMinutes || 460
    );
    setCoachAnswer(ans);
    setCoachQuestion('');
  };

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
      
      {/* 1. Core Daily Lifecycle Stepper (Interactive Navigation) */}
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
            const handleStepClick = () => {
              if (step.id === 'WAKE' || step.id === 'CHECKIN') setActiveView('TRACK');
              else if (step.id === 'PLAN') setActiveView('MY_DAY');
              else if (step.id === 'TASKS') setActiveView('TASKS');
              else if (step.id === 'STUDY') setActiveView('STUDY');
              else if (step.id === 'FOOD') setActiveView('FOOD');
              else if (step.id === 'WATER') { addWater(250); }
              else if (step.id === 'WORKOUT') setActiveView('WORKOUT');
              else if (step.id === 'EVENING') setActiveView('TIMELINE');
              else if (step.id === 'TOMORROW') setActiveView('MY_DAY');
            };

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={handleStepClick}
                  title={`Go to ${step.label}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    step.done
                      ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                      : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{step.label}</span>
                </button>
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
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            Rest Day active: Workout target adapted for recovery.
          </span>
        )}
        {specialMode === 'TRAVEL' && (
          <span className="text-primary font-semibold text-xs">
            Travel Mode active: Routine metrics preserved.
          </span>
        )}
        {specialMode === 'EXAM' && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
            Exam Mode active: Focus blocks prioritized.
          </span>
        )}
      </div>

      {/* 3. Header Greeting & Status Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-br from-card via-card to-primary/5 border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sun className="h-4 w-4" />
            <span>{currentDateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed pt-1">
            System initialized. Add your tasks, syllabus topics, and habits to track your daily progress together.
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
                  {oneThingTask.status === 'COMPLETED' ? 'Completed' : 'Complete'}
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

      {/* 5B. GROUNDED AI COPILOT FOR SHANMUKH & SATVIKA */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Command Assistant &bull; {currentUser.name.split(' ')[0]} &amp; {partnerUser ? partnerUser.name.split(' ')[0] : 'Partner'}
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Grounded in your real stored tasks, exams, hydration, and partner updates.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Live Agenda Synchronized
          </span>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleAskCoach('What should I focus on next?')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>What should I focus on next?</span>
          </button>
          <button
            onClick={() => handleAskCoach('When is our next exam deadline?')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Check exam deadlines</span>
          </button>
          <button
            onClick={() => handleAskCoach('How is our water and sleep?')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all"
          >
            <Droplets className="h-3.5 w-3.5 text-primary" />
            <span>Water &amp; sleep consistency</span>
          </button>
          <button
            onClick={() => handleAskCoach(`Check in on ${partnerUser ? partnerUser.name.split(' ')[0] : 'Partner'}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-foreground transition-all"
          >
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Partner status</span>
          </button>
        </div>

        {/* Interactive Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskCoach(coachQuestion);
          }}
          className="flex gap-2 text-xs"
        >
          <input
            type="text"
            placeholder="Ask AI Copilot anything about your day, deadlines, or partner updates..."
            value={coachQuestion}
            onChange={(e) => setCoachQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xs hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask</span>
          </button>
        </form>

        {/* AI Answer Box */}
        {coachAnswer && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-primary">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Response
              </span>
              <button onClick={() => setCoachAnswer(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              {coachAnswer}
            </p>
          </div>
        )}
      </div>

      {/* 5C. RECENT AI-VERIFIED PHOTO PROOFS */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Recent AI-Verified Photo Proofs
            </h3>
          </div>
          <button
            onClick={() => setActiveView('GALLERY')}
            className="text-[11px] font-bold text-primary hover:underline"
          >
            Open Our Gallery &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.filter(t => t.proof).slice(0, 3).map(task => (
            <div
              key={task.id}
              onClick={() => openLightbox({
                url: task.proof!.imageUrl,
                title: task.title,
                timestamp: task.proof!.timestamp,
                taskId: task.id,
                aiVerification: task.proof!.aiVerification
              })}
              className="p-3 rounded-2xl border border-border bg-background hover:border-primary/50 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <img
                src={task.proof!.imageUrl}
                alt="Proof"
                className="h-14 w-14 rounded-xl object-cover border border-emerald-500/40 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="overflow-hidden space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5 inline" />
                    <span>{task.proof!.aiVerification?.confidence ? `${task.proof!.aiVerification.confidence.toFixed(0)}% Match` : 'Verified'}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">{task.proof!.uploadedBy}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">{task.title}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{task.proof!.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
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
              <Users className="h-5 w-5 text-primary" />
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
                Shared tasks and collaboration
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Workout & Wellness</span>
              <div className="text-lg font-bold text-foreground">
                {partnerWorkout ? `${partnerWorkout.type} Logged` : 'Scheduled'}
              </div>
              <p className="text-xs text-muted-foreground">
                Daily activity log
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2.5">
              <span className="text-xs font-semibold text-muted-foreground">Send Note</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickEncourage('Got this', "You've got this! Standing with you.")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-primary/10 hover:text-primary border border-border font-medium transition-colors"
                >
                  Got this
                </button>
                <button
                  onClick={() => handleQuickEncourage('Break', 'Take a quick break.')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-primary/10 hover:text-primary border border-border font-medium transition-colors"
                >
                  Take break
                </button>
                <button
                  onClick={() => handleQuickEncourage('Great focus', 'Great focus on work today!')}
                  className="px-2.5 py-1 text-xs rounded-lg bg-card hover:bg-primary/10 hover:text-primary border border-border font-medium transition-colors"
                >
                  Great focus
                </button>
              </div>
              {encouragementSent && (
                <p className="text-xs text-emerald-500 font-semibold animate-in fade-in">
                  Sent to {partnerUser.name.split(' ')[0]}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
