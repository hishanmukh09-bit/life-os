'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { TaskItem, TaskCategory, Priority, TaskRecurrence, Visibility } from '@/types';
import { AIService, RescueScheduleResult } from '@/lib/ai-service';
import { parseNaturalLanguageTask, ParsedTaskResult } from '@/lib/task-parser';
import { PhotoPicker } from '@/components/ui/PhotoPicker';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Circle,
  Trash2,
  Shield,
  LifeBuoy,
  X,
  Filter,
  User,
  Repeat,
  Link as LinkIcon,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Bell,
  MoreVertical,
  CalendarDays
} from 'lucide-react';

const CATEGORIES: TaskCategory[] = [
  'Study',
  'College',
  'Work',
  'Fitness',
  'Health',
  'Food',
  'Personal',
  'Household',
  'Relationship',
  'Life Admin',
  'Project',
  'Other'
];

export function TasksView() {
  const {
    currentUser,
    partnerUser,
    tasks,
    trashTasks,
    addTask,
    toggleTask,
    snoozeTask,
    rescheduleTask,
    deleteTask,
    restoreTask,
    toggleTaskSubtask,
    openLightbox
  } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MINE' | 'SHARED' | 'COMPLETED' | 'TRASH'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState<TaskItem | null>(null);
  const [realProofUrl, setRealProofUrl] = useState<string>('');
  const [rescueResult, setRescueResult] = useState<RescueScheduleResult | null>(null);

  // Fast Natural Language Entry
  const [quickInput, setQuickInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedTaskResult | null>(null);

  // Reschedule Modal state
  const [rescheduleModalTask, setRescheduleModalTask] = useState<TaskItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [rescheduleTime, setRescheduleTime] = useState('17:00');

  // Full Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [reminderOption, setReminderOption] = useState<string>('15_MIN');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('NONE');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [proofRequired, setProofRequired] = useState(false);
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string>('');

  // Handle Quick Input Parsing
  const handleQuickInputChange = (val: string) => {
    setQuickInput(val);
    if (val.trim().length > 5) {
      const parsed = parseNaturalLanguageTask(val);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  };

  const handleSaveQuickTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedPreview || !parsedPreview.title.trim()) return;

    addTask({
      title: parsedPreview.title,
      description: 'Quick entry via natural language parser',
      category: parsedPreview.category,
      priority: parsedPreview.priority,
      visibility: 'PRIVATE',
      status: 'TODO',
      dueDate: parsedPreview.dueDate,
      dueTime: parsedPreview.dueTime,
      recurrence: 'NONE',
      estimatedMinutes: 30,
      proofRequired: false,
      assignedToId: currentUser.id
    });

    setQuickInput('');
    setParsedPreview(null);
  };

  // Task filtering
  const filteredTasks = activeFilter === 'TRASH' ? trashTasks : tasks.filter(task => {
    const isAccessible = task.creatorId === currentUser.id || task.visibility === 'SHARED';
    if (!isAccessible) return false;

    if (activeFilter === 'MINE') {
      if (task.creatorId !== currentUser.id) return false;
    } else if (activeFilter === 'SHARED') {
      if (task.visibility !== 'SHARED') return false;
    } else if (activeFilter === 'COMPLETED') {
      if (task.status !== 'COMPLETED') return false;
    }

    if (categoryFilter !== 'ALL' && task.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      visibility,
      status: 'TODO',
      dueDate,
      dueTime,
      recurrence,
      estimatedMinutes,
      proofRequired,
      assignedToId,
      dependsOnTaskId: dependsOnTaskId || undefined,
      subtasks: [
        { id: 'sub_' + Date.now(), title: 'Phase 1: Initial research & setup', completed: false }
      ]
    });

    setTitle('');
    setDescription('');
    setDependsOnTaskId('');
    setShowAddModal(false);
  };

  const handleTaskClick = (task: TaskItem) => {
    if (task.dependsOnTaskId) {
      const parent = tasks.find(t => t.id === task.dependsOnTaskId);
      if (parent && parent.status !== 'COMPLETED') {
        const proceed = confirm(`⚠️ Dependency Alert: "${parent.title}" is not completed yet. Do you want to complete this task anyway?`);
        if (!proceed) return;
      }
    }

    if (task.status !== 'COMPLETED' && task.proofRequired && !task.proof) {
      setRealProofUrl('');
      setShowProofModal(task);
    } else {
      toggleTask(task.id);
    }
  };

  const submitProofCompletion = () => {
    if (!showProofModal) return;
    if (!realProofUrl) {
      alert('⚠️ Authentic photo proof is required to complete this task. Please take a photo or select one from your gallery.');
      return;
    }
    const res = toggleTask(showProofModal.id, realProofUrl);
    if (!res.success && res.error === 'PROOF_REQUIRED') {
      alert('⚠️ Photo proof is required to complete this task.');
      return;
    }
    setShowProofModal(null);
    setRealProofUrl('');
  };

  const handleRescueMyDay = () => {
    const result = AIService.rescueMyDay(tasks);
    setRescueResult(result);
  };

  const handleSaveReschedule = () => {
    if (!rescheduleModalTask) return;
    rescheduleTask(rescheduleModalTask.id, rescheduleDate, rescheduleTime);
    setRescheduleModalTask(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <CheckSquare className="h-4 w-4" />
            <span>Persistent Task & Execution Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Tasks, Schedule & Real Reminders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Instant SQLite persistence, natural language entry, active reminders, dependencies, and real photo proof.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRescueMyDay}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3.5 py-2 text-xs font-bold hover:bg-amber-500/20 transition-all"
          >
            <LifeBuoy className="h-4 w-4" />
            <span>Rescue My Day</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Detailed Task</span>
          </button>
        </div>
      </div>

      {/* FAST NATURAL LANGUAGE TASK ENTRY BAR (Requirement 3) */}
      <div className="p-4 rounded-3xl border border-primary/20 bg-card shadow-xs space-y-2">
        <form onSubmit={handleSaveQuickTask} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Fast task entry: 'Complete DBMS assignment tomorrow at 6 PM' or 'Workout Saturday at 10 AM'..."
              value={quickInput}
              onChange={(e) => handleQuickInputChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95 disabled:opacity-40 transition-all shrink-0 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            <span>Save Task</span>
          </button>
        </form>

        {/* Live Interpretation Preview */}
        {parsedPreview && (
          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" /> Understood as:
              </span>
              <span className="text-foreground font-semibold">&ldquo;{parsedPreview.title}&rdquo;</span>
              <span className="text-muted-foreground">&bull; {parsedPreview.interpretedText}</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setTitle(parsedPreview.title);
                  setDueDate(parsedPreview.dueDate);
                  setDueTime(parsedPreview.dueTime);
                  setCategory(parsedPreview.category);
                  setPriority(parsedPreview.priority);
                  setReminderOption(parsedPreview.reminderOption);
                  setShowAddModal(true);
                }}
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground underline"
              >
                Edit in Full Form
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rescue My Day Banner if Triggered */}
      {rescueResult && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-foreground">Rescue My Day Plan</h3>
            </div>
            <button onClick={() => setRescueResult(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{rescueResult.rationale}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded-2xl bg-card border border-border">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">KEEP TODAY ({rescueResult.keep.length})</span>
              <ul className="mt-2 space-y-1 text-xs text-foreground">
                {rescueResult.keep.map(t => <li key={t.id} className="truncate">&bull; {t.title}</li>)}
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-border">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">MOVE TO TOMORROW ({rescueResult.move.length})</span>
              <ul className="mt-2 space-y-1 text-xs text-foreground">
                {rescueResult.move.map(t => <li key={t.id} className="truncate">&bull; {t.title}</li>)}
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-card border border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">OPTIONAL / DEPRIORITIZED ({rescueResult.optional.length})</span>
              <ul className="mt-2 space-y-1 text-xs text-foreground">
                {rescueResult.optional.map(t => <li key={t.id} className="truncate">&bull; {t.title}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${activeFilter === 'ALL' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveFilter('MINE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${activeFilter === 'MINE' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            My Private
          </button>
          <button
            onClick={() => setActiveFilter('SHARED')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${activeFilter === 'SHARED' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Shared
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${activeFilter === 'COMPLETED' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveFilter('TRASH')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${activeFilter === 'TRASH' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Trash Recovery ({trashTasks.length})
          </button>
        </div>

        {/* Category selector */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter tasks by category"
          className="rounded-2xl border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          /* Beautiful welcoming empty state (Requirements 13 & 14) */
          <div className="text-center p-12 rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nothing planned yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your first task and we&apos;ll help you organize your day with real reminders and zero stress.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95"
            >
              + Add First Task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const parentTask = task.dependsOnTaskId ? tasks.find(t => t.id === task.dependsOnTaskId) : null;

            // Overdue calculation (Requirement 12)
            const isOverdue = !isDone && task.dueDate && (
              new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`) < new Date()
            );

            return (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl border transition-all gap-3 ${
                  isDone
                    ? 'border-border/40 bg-card/40 opacity-70'
                    : isOverdue
                      ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500 shadow-xs'
                      : 'border-border bg-card hover:border-primary/40 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>

                      {isOverdue && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                    )}

                    {/* Dependency Chain Badge */}
                    {parentTask && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md w-fit">
                        <LinkIcon className="h-3 w-3" />
                        <span>Depends on: <strong>{parentTask.title}</strong> ({parentTask.status === 'COMPLETED' ? 'Done ✓' : 'Pending'})</span>
                      </div>
                    )}

                    {/* Subtasks checklist */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        {task.subtasks.map(s => (
                          <div
                            key={s.id}
                            onClick={() => toggleTaskSubtask(task.id, s.id)}
                            className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                          >
                            {s.completed ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3" />}
                            <span className={s.completed ? 'line-through' : ''}>{s.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {task.category}
                      </span>

                      {task.priority === 'MUST_DO' && (
                        <span className="font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Must Do
                        </span>
                      )}

                      {task.dueDate && (
                        <span className="text-muted-foreground flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate} {task.dueTime}
                        </span>
                      )}

                      {task.proofRequired && (
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <Camera className="h-3 w-3" /> Proof Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions & Reminders Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Snooze & Reschedule Quick Action Chips */}
                  {!isDone && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => snoozeTask(task.id, 10)}
                        className="px-2 py-1 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold"
                        title="Snooze 10 minutes"
                      >
                        +10m
                      </button>
                      <button
                        type="button"
                        onClick={() => snoozeTask(task.id, 30)}
                        className="px-2 py-1 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold"
                        title="Snooze 30 minutes"
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleModalTask(task);
                          setRescheduleDate(task.dueDate || new Date().toISOString().split('T')[0]);
                          setRescheduleTime(task.dueTime || '17:00');
                        }}
                        className="px-2 py-1 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                        title="Reschedule Date & Time"
                      >
                        <CalendarDays className="h-3 w-3" />
                        <span>Reschedule</span>
                      </button>
                    </div>
                  )}

                  {/* Task Proof Preview if exists */}
                  {task.proof && (
                    <div
                      onClick={() => openLightbox({
                        url: task.proof!.imageUrl,
                        title: `Proof: ${task.title}`,
                        timestamp: task.proof!.timestamp,
                        taskId: task.id,
                        aiVerification: task.proof!.aiVerification
                      })}
                      className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-500 cursor-pointer shadow-xs group bg-muted/40"
                      title="Click to view full photo proof"
                    >
                      <img src={task.proof.imageUrl} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                        View
                      </div>
                    </div>
                  )}

                  {activeFilter === 'TRASH' ? (
                    <button
                      onClick={() => restoreTask(task.id)}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Move to trash"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reschedule Modal (Requirement 14) */}
      {rescheduleModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground">Reschedule Task</h3>
              <button onClick={() => setRescheduleModalTask(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Reschedule <strong className="text-foreground">{rescheduleModalTask.title}</strong>. Old reminders will be cancelled and updated automatically.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">New Due Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">New Due Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setRescheduleModalTask(null)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReschedule}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm"
                >
                  Save Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal with All Fields (Requirement 4) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground">Create New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finish kinematic Jacobians derivation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="MUST_DO">Must Do</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Reminder Notification</label>
                  <select
                    value={reminderOption}
                    onChange={(e) => setReminderOption(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="NONE">None</option>
                    <option value="AT_TIME">At task time</option>
                    <option value="5_MIN">5 minutes before</option>
                    <option value="15_MIN">15 minutes before</option>
                    <option value="30_MIN">30 minutes before</option>
                    <option value="1_HOUR">1 hour before</option>
                    <option value="1_DAY">1 day before</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Repeat Schedule</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="NONE">None</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKDAYS">Weekdays (Mon-Fri)</option>
                    <option value="WEEKENDS">Weekends</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Task Dependency (Must complete first)</label>
                  <select
                    value={dependsOnTaskId}
                    onChange={(e) => setDependsOnTaskId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="">None (Independent task)</option>
                    {tasks.filter(t => t.status !== 'COMPLETED').map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as Visibility)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="PRIVATE">Private (You Only)</option>
                    <option value="SHARED">Shared with Partner</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="proofRequiredCheck"
                  checked={proofRequired}
                  onChange={(e) => setProofRequired(e.target.checked)}
                  className="rounded-sm"
                />
                <label htmlFor="proofRequiredCheck" className="font-semibold text-foreground cursor-pointer">
                  Require Photo Proof upon completion (Authentic Camera/Gallery upload required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-95"
                >
                  Create & Persist Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL PHOTO PROOF MODAL (Requirements 2, 3, 20) */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Attach Authentic Proof</h3>
                  <span className="text-[10px] text-muted-foreground">Real camera photo or gallery upload only</span>
                </div>
              </div>
              <button onClick={() => setShowProofModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Verifying completion for: <span className="font-semibold text-foreground">{showProofModal.title}</span>
            </p>

            {/* REAL USER PHOTO PICKER (Camera or Gallery) */}
            <PhotoPicker
              label="Task Completion Evidence"
              required={true}
              parentType="TASK_PROOF"
              parentId={showProofModal.id}
              visibility={showProofModal.visibility}
              ownerId={currentUser.id}
              onPhotoSelected={(url) => setRealProofUrl(url)}
              onPhotoRemoved={() => setRealProofUrl('')}
            />

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setShowProofModal(null);
                  setRealProofUrl('');
                }}
                className="text-xs font-semibold text-muted-foreground hover:underline"
              >
                Cancel (Leave Incomplete)
              </button>

              <button
                type="button"
                disabled={!realProofUrl}
                onClick={submitProofCompletion}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 hover:opacity-95 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verify & Complete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
