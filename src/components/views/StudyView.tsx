'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/store';
import { StudySession, StudySubject, StudyTopic, SyllabusUnit, StudyPlanDay, ActiveRecallQuestion, TeachMeTopic } from '@/types';
import { AIService } from '@/lib/ai-service';
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
  Lightbulb,
  FileText,
  BrainCircuit,
  Zap,
  CheckCircle,
  HelpCircle,
  Send,
  X,
  Layers,
  ArrowRight
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
    addExam,
    addTask
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

  // Student OS: Syllabus Parsing & Study Plan Generator Modal
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [syllabusInput, setSyllabusInput] = useState(`Unit 1: Graph Theory & Shortest Paths
* Dijkstra's Algorithm & Fibonacci Heaps
* Bellman-Ford & Negative Cycles
* Floyd-Warshall All-Pairs Shortest Path
* Topological Sorting in DAGs

Unit 2: Dynamic Programming & Greedy
* 0/1 Knapsack & Fractional Knapsack
* Longest Common Subsequence (LCS)
* Matrix Chain Multiplication
* Huffman Coding & Amortized Analysis

Unit 3: Robotics Dynamics & Control
* Newton-Euler Formulation
* Inertia Tensors & Coordinate Frames
* Coriolis and Centrifugal Force Tensors
* PID Joint Trajectory Tracking`);
  const [syllabusExamDays, setSyllabusExamDays] = useState(9);
  const [syllabusDailyHours, setSyllabusDailyHours] = useState(2.5);
  const [parsedUnits, setParsedUnits] = useState<SyllabusUnit[] | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanDay[] | null>(null);

  // Student OS: "Teach Me" Modal
  const [teachMeData, setTeachMeData] = useState<TeachMeTopic | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  // Student OS: "Test Me" Active Recall Quiz Modal
  const [activeQuiz, setActiveQuiz] = useState<{
    topicTitle: string;
    subjId: string;
    topId: string;
    questions: ActiveRecallQuestion[];
    currentIdx: number;
    selectedOption: number | null;
    showExplanation: boolean;
    score: number;
    quizCompleted: boolean;
  } | null>(null);

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
    alert(`Focus block complete! ${pendingMins} minutes logged for ${selectedSubject}.`);
  };

  // Syllabus Parsing & Plan Generation
  const handleParseSyllabus = () => {
    if (!syllabusInput.trim()) return;
    const units = AIService.parseSyllabus(syllabusInput);
    setParsedUnits(units);
    const plan = AIService.generateStudyPlan('Computer Science & Robotics', units, syllabusExamDays, syllabusDailyHours);
    setGeneratedPlan(plan);
  };

  const handleApplyPlanToTasks = () => {
    if (!generatedPlan) return;
    let addedCount = 0;
    generatedPlan.slice(0, 3).forEach(day => {
      day.topics.forEach(top => {
        addTask({
          title: `Study [${day.mode}]: ${top}`,
          description: `Generated from Syllabus-to-Plan Engine. Day ${day.dayNumber} block (~${Math.round(day.durationMinutes / day.topics.length)} mins).`,
          category: 'Study',
          priority: day.mode === 'MOCK_TEST' ? 'MUST_DO' : 'HIGH',
          visibility: 'SHARED',
          status: 'TODO',
          dueDate: day.date,
          dueTime: '10:00',
          recurrence: 'NONE',
          estimatedMinutes: Math.round(day.durationMinutes / day.topics.length),
          proofRequired: false
        });
        addedCount++;
      });
    });
    alert(`Successfully converted ${addedCount} study plan milestones into actionable daily tasks.`);
    setShowSyllabusModal(false);
  };

  // "Teach Me" Handler
  const openTeachMe = (topicTitle: string) => {
    const data = AIService.getTeachMeTopic(topicTitle);
    setTeachMeData(data);
    setShowQuizAnswer(false);
  };

  // "Test Me" Handler
  const openTestMe = (subjId: string, top: StudyTopic) => {
    const questions = AIService.getActiveRecallQuiz(top.title);
    setActiveQuiz({
      topicTitle: top.title,
      subjId,
      topId: top.id,
      questions,
      currentIdx: 0,
      selectedOption: null,
      showExplanation: false,
      score: 0,
      quizCompleted: false
    });
  };

  const handleSelectQuizOption = (optIdx: number) => {
    if (!activeQuiz || activeQuiz.showExplanation) return;
    const currentQ = activeQuiz.questions[activeQuiz.currentIdx];
    const isCorrect = optIdx === currentQ.correctAnswer;
    setActiveQuiz({
      ...activeQuiz,
      selectedOption: optIdx,
      showExplanation: true,
      score: isCorrect ? activeQuiz.score + 1 : activeQuiz.score
    });
  };

  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    if (activeQuiz.currentIdx + 1 < activeQuiz.questions.length) {
      setActiveQuiz({
        ...activeQuiz,
        currentIdx: activeQuiz.currentIdx + 1,
        selectedOption: null,
        showExplanation: false
      });
    } else {
      const finalAccuracy = Math.round(((activeQuiz.score) / activeQuiz.questions.length) * 100);
      updateTopicMastery(activeQuiz.subjId, activeQuiz.topId, finalAccuracy >= 66 ? 15 : -5);
      setActiveQuiz({
        ...activeQuiz,
        quizCompleted: true
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            <span>Student Operating System</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Academic & Focus Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Syllabus-to-Plan engine, topic revision mastery, Pomodoro blocks, and Active Recall &ldquo;Test Me&rdquo;.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setShowSyllabusModal(true);
              if (!parsedUnits) handleParseSyllabus();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-linear-to-r from-primary to-indigo-600 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:opacity-95 transition-all"
          >
            <Layers className="h-4 w-4" />
            <span>Syllabus &rarr; Study Plan</span>
          </button>

          <span className="text-xs font-semibold px-3 py-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
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
                <h2 className="text-base font-bold text-foreground">Course Mastery & Active Recall Radar</h2>
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
                  <div className="space-y-2 pt-1">
                    {subj.topics.map((top) => (
                      <div
                        key={top.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {top.masteryPercentage >= 100 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                              {top.masteryPercentage}%
                            </div>
                          )}
                          <div>
                            <span className={`font-semibold block ${top.masteryPercentage >= 100 ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {top.title}
                            </span>
                            {top.isWeakTopic && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-rose-500/10 text-rose-500">
                                Weak Radar Flag
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Student OS Actions: Teach Me, Test Me, Mastery Adjustments */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => openTeachMe(top.title)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition-all"
                            title="Interactive AI Teacher Explanation"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Teach Me</span>
                          </button>

                          <button
                            onClick={() => openTestMe(subj.id, top)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] transition-all"
                            title="Active Recall Quiz & Conceptual Testing"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Test Me</span>
                          </button>

                          <div className="flex items-center gap-1 border-l border-border/60 pl-1.5">
                            <button
                              onClick={() => updateTopicMastery(subj.id, top.id, -10)}
                              className="h-6 w-6 rounded-md bg-card hover:bg-muted text-foreground font-bold flex items-center justify-center"
                              title="Decrease mastery"
                            >
                              -
                            </button>
                            <button
                              onClick={() => updateTopicMastery(subj.id, top.id, 10)}
                              className="h-6 w-6 rounded-md bg-card hover:bg-muted text-foreground font-bold flex items-center justify-center"
                              title="Increase mastery"
                            >
                              +
                            </button>
                          </div>
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
                <div key={exam.id} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/50 space-y-2 text-xs">
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
                  <div className="flex flex-wrap gap-1 pt-1">
                    {exam.topics.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-background border border-border text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* SYLLABUS PARSER & STUDY PLAN GENERATOR MODAL */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Layers className="h-5 w-5" />
                <h3 className="text-lg text-foreground">Syllabus-to-Plan Engine</h3>
              </div>
              <button onClick={() => setShowSyllabusModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste your course syllabus below. LIFE OS will parse units and topics, calculate available hours before your exam, and structure a day-by-day plan with learning, practice, and spaced revision.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Paste Course Syllabus</label>
                <textarea
                  rows={6}
                  value={syllabusInput}
                  onChange={(e) => setSyllabusInput(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-background font-mono text-[11px] text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="Unit 1: Topic 1, Topic 2..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Days Until Exam</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={syllabusExamDays}
                    onChange={(e) => setSyllabusExamDays(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Daily Study Target (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    max={12}
                    value={syllabusDailyHours}
                    onChange={(e) => setSyllabusDailyHours(parseFloat(e.target.value) || 2)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseSyllabus}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Parse & Calculate Plan</span>
                </button>
              </div>

              {/* Generated Plan Preview */}
              {generatedPlan && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Generated {generatedPlan.length}-Day Study Roadmap</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Includes Mock Simulation & Spaced Revision</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {generatedPlan.map(day => (
                      <div key={day.dayNumber} className="p-3 rounded-xl border border-border/60 bg-secondary/30 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">Day {day.dayNumber} ({day.date})</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              day.mode === 'MOCK_TEST' ? 'bg-rose-500/10 text-rose-500' :
                              day.mode === 'REVISE' ? 'bg-amber-500/10 text-amber-500' :
                              day.mode === 'PRACTICE' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {day.mode}
                            </span>
                          </div>
                          <ul className="mt-1 space-y-0.5 text-muted-foreground text-[11px]">
                            {day.topics.map((t, i) => <li key={i}>&bull; {t}</li>)}
                          </ul>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">{day.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSyllabusModal(false)}
                      className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPlanToTasks}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm hover:opacity-95"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Convert Milestones to Daily Tasks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEACH ME MODAL (AI Teacher) */}
      {teachMeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-500 font-bold">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base text-foreground">AI Teacher: {teachMeData.topic}</h3>
              </div>
              <button onClick={() => setTeachMeData(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase text-[10px]">1. Prerequisites</span>
                <p className="text-foreground">{teachMeData.prerequisite}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block uppercase text-[10px] text-muted-foreground">2. Mental Model & Intuition</span>
                <p className="text-foreground leading-relaxed bg-secondary/30 p-3 rounded-2xl border border-border/50">{teachMeData.intuition}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block uppercase text-[10px] text-muted-foreground">3. Formal Definition & Math</span>
                <p className="text-foreground font-mono text-[11px] leading-relaxed bg-background p-3 rounded-2xl border border-border">{teachMeData.formalExplanation}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-foreground block uppercase text-[10px] text-muted-foreground">4. Worked Example</span>
                <p className="text-foreground leading-relaxed bg-secondary/30 p-3 rounded-2xl border border-border/50">{teachMeData.workedExample}</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="font-bold text-rose-500 block uppercase text-[10px]">5. Common Pitfalls & Mistakes</span>
                <p className="text-foreground">{teachMeData.commonMistakes}</p>
              </div>

              {/* Mini Check */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2">
                <span className="font-bold text-primary block uppercase text-[10px]">6. Quick Self-Check</span>
                <p className="text-foreground font-medium">{teachMeData.quiz.question}</p>
                {showQuizAnswer ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in">
                    &bull; {teachMeData.quiz.answer}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowQuizAnswer(true)}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Reveal Answer &check;
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTeachMeData(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST ME ACTIVE RECALL QUIZ MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-bold">
                <Zap className="h-5 w-5" />
                <h3 className="text-base text-foreground">Active Recall: {activeQuiz.topicTitle}</h3>
              </div>
              <button onClick={() => setActiveQuiz(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!activeQuiz.quizCompleted ? (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Question {activeQuiz.currentIdx + 1} of {activeQuiz.questions.length}</span>
                  <span className="px-2 py-0.5 rounded-md bg-secondary font-bold text-[10px] text-foreground">
                    {activeQuiz.questions[activeQuiz.currentIdx].type}
                  </span>
                </div>

                <p className="text-sm font-bold text-foreground">
                  {activeQuiz.questions[activeQuiz.currentIdx].question}
                </p>

                {/* Options */}
                <div className="space-y-2">
                  {activeQuiz.questions[activeQuiz.currentIdx].options?.map((opt, idx) => {
                    const isSelected = activeQuiz.selectedOption === idx;
                    const isCorrect = idx === activeQuiz.questions[activeQuiz.currentIdx].correctAnswer;
                    let style = 'bg-secondary/40 border-border hover:bg-secondary';

                    if (activeQuiz.showExplanation) {
                      if (isCorrect) style = 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                      else if (isSelected && !isCorrect) style = 'bg-rose-500/20 border-rose-500 text-rose-500';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={activeQuiz.showExplanation}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all text-xs ${style}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {activeQuiz.showExplanation && (
                  <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border space-y-1.5 animate-in fade-in">
                    <span className="font-bold text-foreground block">Explanation & Asymptotics:</span>
                    <p className="text-muted-foreground leading-relaxed">
                      {activeQuiz.questions[activeQuiz.currentIdx].explanation}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  {activeQuiz.showExplanation && (
                    <button
                      type="button"
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{activeQuiz.currentIdx + 1 < activeQuiz.questions.length ? 'Next Question' : 'Complete Drill & Sync'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3 animate-in fade-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-foreground">Recall Session Complete!</h4>
                <p className="text-xs text-muted-foreground">
                  Score: <span className="font-bold text-foreground">{activeQuiz.score} / {activeQuiz.questions.length}</span> ({Math.round((activeQuiz.score / activeQuiz.questions.length) * 100)}% accuracy).
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Topic mastery has been automatically updated in your Course Mastery Breakdown.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveQuiz(null)}
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                  >
                    Return to Hub
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
