'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/store';
import { StudySession } from '@/types';
import {
  GraduationCap,
  Timer,
  BookOpen,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Clock,
  Sparkles,
  TrendingUp,
  Camera,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export function StudyView() {
  const {
    currentUser,
    studySubjects,
    exams,
    studySessions,
    updateTopicMastery,
    logStudySession,
    addStudySubject,
    addExam
  } = useLifeOS();

  // Focus Timer state
  const [focusMode, setFocusMode] = useState<StudySession['focusMode']>('25m');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>(studySubjects[0]?.name || 'Independent Study');

  // Post study knowledge capture
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [capturedTakeaway, setCapturedTakeaway] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [pendingMins, setPendingMins] = useState(25);

  const [deadlineTab, setDeadlineTab] = useState<'ALL' | 'EXAMS' | 'ASSIGNMENTS' | 'PROJECTS'>('ALL');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isRunning) {
      setIsRunning(false);
      const mins = focusMode === '25m' ? 25 : focusMode === '50m' ? 50 : 90;
      setPendingMins(mins);
      setShowCaptureModal(true);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, focusMode, selectedSubject]);

  const setTimerMode = (mode: StudySession['focusMode']) => {
    setFocusMode(mode);
    setIsRunning(false);
    if (mode === '25m') setSecondsRemaining(25 * 60);
    else if (mode === '50m') setSecondsRemaining(50 * 60);
    else if (mode === '90m') setSecondsRemaining(90 * 60);
    else setSecondsRemaining(45 * 60);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveTakeaway = (e: React.FormEvent) => {
    e.preventDefault();
    logStudySession(
      pendingMins,
      focusMode,
      selectedSubject,
      capturedTakeaway.trim() || undefined,
      capturedPhoto.trim() || undefined
    );
    setCapturedTakeaway('');
    setCapturedPhoto('');
    setShowCaptureModal(false);
    alert(`🎉 Focus block complete! ${pendingMins} minutes logged for ${selectedSubject}.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Academic & Focus Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Topic revision mastery, Pomodoro focus blocks, Spaced Revision & Knowledge Capture.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
            Target: {currentUser.dailyStudyTargetHours || 4}h / day
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Subject Mastery & Deadline Radar */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Study Dashboard Topics */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-indigo-500">
                <GraduationCap className="h-5 w-5" />
                <h2 className="text-base font-bold text-foreground">Course Mastery Breakdown</h2>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                Spaced Revision Active
              </span>
            </div>

            <div className="space-y-5">
              {studySubjects.map((subj) => (
                <div key={subj.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: subj.color }} />
                      <span className="text-sm font-bold text-foreground">{subj.name}</span>
                      {subj.code && <span className="text-[10px] font-mono text-muted-foreground">{subj.code}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">Target: {subj.targetHoursWeekly}h/week</span>
                  </div>

                  {/* Topics breakdown */}
                  <div className="space-y-1.5 pt-1">
                    {subj.topics.map((top) => (
                      <div
                        key={top.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {top.masteryPercentage >= 100 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-muted-foreground flex items-center justify-center text-[9px] font-bold">
                              {top.masteryPercentage}%
                            </div>
                          )}
                          <span className={`font-medium ${top.masteryPercentage >= 100 ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {top.title}
                          </span>
                          {top.isWeakTopic && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-500/10 text-rose-500">
                              Weak Topic Radar
                            </span>
                          )}
                        </div>

                        {/* Quick mastery delta adjustments */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateTopicMastery(subj.id, top.id, -10)}
                            className="h-6 w-6 rounded-md bg-card hover:bg-muted text-foreground font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            onClick={() => updateTopicMastery(subj.id, top.id, 10)}
                            className="h-6 w-6 rounded-md bg-card hover:bg-muted text-foreground font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Deadline Radar */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-base font-bold text-foreground">Student Deadline Radar</h2>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {(['ALL', 'EXAMS', 'ASSIGNMENTS'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDeadlineTab(tab)}
                    className={`px-2 py-0.5 rounded-md ${deadlineTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    DUE IN 3 DAYS
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-500">Oct 07</span>
                </div>
                <h3 className="text-xs font-bold text-foreground pt-1">
                  Robotics Dynamics Problem Set #4
                </h3>
                <p className="text-[11px] text-muted-foreground">Derivation of Coriolis terms & verification in Python.</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    DUE IN 12 DAYS
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-500">Oct 16</span>
                </div>
                <h3 className="text-xs font-bold text-foreground pt-1">
                  Robotics Dynamics Midterm Exam
                </h3>
                <p className="text-[11px] text-muted-foreground">Inertia Tensors, recursive Newton-Euler formulation.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Focus Timer & Exam Countdowns */}
        <div className="space-y-6">
          
          {/* Focus Timer */}
          <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-xs text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary uppercase">
              <Timer className="h-4 w-4" /> Focus Block Timer
            </div>

            {/* Mode selection */}
            <div className="flex justify-center gap-1.5">
              {(['25m', '50m', '90m', 'Custom'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTimerMode(mode)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    focusMode === mode
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="py-4">
              <div className="text-5xl font-mono font-extrabold tracking-tight text-foreground">
                {formatTimer(secondsRemaining)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Subject: <span className="font-semibold text-foreground">{selectedSubject}</span>
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 hover:opacity-95"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={() => setTimerMode(focusMode)}
                className="p-2.5 rounded-2xl border border-border hover:bg-muted text-muted-foreground"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Exam Radar List */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Examinations
            </h3>

            <div className="space-y-3 pt-1">
              {exams.map(exam => (
                <div key={exam.id} className="p-3 rounded-2xl bg-secondary/30 border border-border/50 space-y-1.5 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-foreground">{exam.subjectName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      12 days left
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Revision Progress</span>
                    <span className="font-semibold text-foreground">{exam.revisionProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${exam.revisionProgress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Post-Study Knowledge Capture Modal */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="h-5 w-5" />
              <h3 className="text-base font-bold text-foreground">Knowledge Capture: What did you learn?</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Consolidate your memory by entering the core concept or formula you internalized in this focus block.
            </p>

            <form onSubmit={handleSaveTakeaway} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                placeholder="Core takeaway, derivation, or formula learned..."
                value={capturedTakeaway}
                onChange={(e) => setCapturedTakeaway(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-background text-foreground"
              />

              <div>
                <label className="font-semibold text-foreground">Photo of handwritten notes / board (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or snapshot URL"
                  value={capturedPhoto}
                  onChange={(e) => setCapturedPhoto(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowCaptureModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Save Takeaway & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
