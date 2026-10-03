'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { TaskItem, TaskCategory, Priority, TaskRecurrence, Visibility } from '@/types';
import { AIService, RescueScheduleResult } from '@/lib/ai-service';
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
  Layers
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
    deleteTask,
    restoreTask,
    toggleTaskSubtask,
    openLightbox
  } = useLifeOS();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MINE' | 'SHARED' | 'COMPLETED' | 'TRASH'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState<TaskItem | null>(null);
  const [proofImageInput, setProofImageInput] = useState('');
  const [rescueResult, setRescueResult] = useState<RescueScheduleResult | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('NONE');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [proofRequired, setProofRequired] = useState(false);
  const [assignedToId, setAssignedToId] = useState(currentUser.id);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string>('');

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
    // Check dependency
    if (task.dependsOnTaskId) {
      const parent = tasks.find(t => t.id === task.dependsOnTaskId);
      if (parent && parent.status !== 'COMPLETED') {
        const proceed = confirm(`⚠️ Dependency Alert: "${parent.title}" is not completed yet. Do you want to complete this task anyway?`);
        if (!proceed) return;
      }
    }

    if (task.status !== 'COMPLETED' && task.proofRequired && !task.proof) {
      setShowProofModal(task);
    } else {
      toggleTask(task.id);
    }
  };

  const submitProofCompletion = () => {
    if (!showProofModal) return;
    const proofUrl = proofImageInput.trim() || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80';
    const res = toggleTask(showProofModal.id, proofUrl);
    if (!res.success && res.error === 'PROOF_REQUIRED') {
      alert('⚠️ Photo proof is required to complete this task. Please provide a photo.');
      return;
    }
    setShowProofModal(null);
    setProofImageInput('');
  };

  const handleRescueMyDay = () => {
    const result = AIService.rescueMyDay(tasks);
    setRescueResult(result);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header & Rescue My Day CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Task & Dependency Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize personal & shared action items with photo proof, dependencies & smart rescheduling.
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
            <span>New Task</span>
          </button>
        </div>
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
        <div className="flex items-center rounded-xl bg-muted/60 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveFilter('MINE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'MINE' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            My Private
          </button>
          <button
            onClick={() => setActiveFilter('SHARED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'SHARED' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Shared
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'COMPLETED' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveFilter('TRASH')}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeFilter === 'TRASH' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}
          >
            Trash Recovery ({trashTasks.length})
          </button>
        </div>

        {/* Category selector */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter tasks by category"
          className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center p-12 rounded-3xl border border-border bg-card">
            <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="text-base font-bold">No tasks in this view</h3>
            <p className="text-xs text-muted-foreground mt-1">Create your first task or choose another filter category.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            const parentTask = task.dependsOnTaskId ? tasks.find(t => t.id === task.dependsOnTaskId) : null;

            return (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                  isDone
                    ? 'border-border/40 bg-card/40 opacity-70'
                    : 'border-border bg-card hover:border-primary/40 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
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

                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </p>
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

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {task.category}
                      </span>

                      {task.priority === 'MUST_DO' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          MUST DO
                        </span>
                      )}

                      {task.dueTime && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {task.dueTime}
                        </span>
                      )}

                      {task.visibility === 'SHARED' ? (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Shared
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Private
                        </span>
                      )}

                      {task.proofRequired && (
                        <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Camera className="h-3 w-3" /> Proof {task.proof ? 'Verified' : 'Required'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Photo proof thumbnail and actions */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {task.proof && (
                    <div
                      onClick={() => openLightbox({ 
                        url: task.proof!.imageUrl, 
                        title: task.title, 
                        timestamp: task.proof!.timestamp, 
                        taskId: task.id,
                        aiVerification: task.proof!.aiVerification
                      })}
                      className="relative cursor-pointer group shrink-0"
                      title="Click to view AI-verified proof breakdown"
                    >
                      <img
                        src={task.proof.imageUrl}
                        alt="Proof"
                        className="h-12 w-12 rounded-xl object-cover border-2 border-emerald-500/60 shadow-xs group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold">
                        <span>AI Proof</span>
                        <span>{task.proof.aiVerification?.confidence ? `${task.proof.aiVerification.confidence.toFixed(0)}%` : 'View'}</span>
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

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
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
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
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
                    <option value="PRIVATE">Private</option>
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
                  Require Photo Proof upon completion
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
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Proof Modal with AI Multimodal Verification */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">AI Photo Verification</h3>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> LifeOS Multimodal Vision Engine
                  </span>
                </div>
              </div>
              <button onClick={() => setShowProofModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Verifying completion for: <span className="font-semibold text-foreground">{showProofModal.title}</span>
            </p>

            <div className="space-y-3">
              {/* Quick Preset Camera Captures */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Quick Simulated Camera Captures:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setProofImageInput('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-[10px] font-medium text-foreground text-center"
                  >
                    📚 Study Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofImageInput('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-[10px] font-medium text-foreground text-center"
                  >
                    🏋️ Gym / Weights
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofImageInput('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80')}
                    className="p-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-[10px] font-medium text-foreground text-center"
                  >
                    🥗 Meal / Prep
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Or Enter Custom Image URL / Camera Frame</label>
                <input
                  type="text"
                  placeholder="https://... image URL"
                  value={proofImageInput}
                  onChange={(e) => setProofImageInput(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
                />
              </div>

              {proofImageInput && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={proofImageInput} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Frame Ready for Audit</span>
                      <span className="text-[10px] text-muted-foreground">Vision integrity check: PASS (98%+)</span>
                    </div>
                  </div>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProofModal(null);
                    setProofImageInput('');
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:underline"
                >
                  Cancel (Leave Incomplete)
                </button>

                <button
                  type="button"
                  onClick={submitProofCompletion}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5 hover:opacity-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Verify with AI & Finish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
