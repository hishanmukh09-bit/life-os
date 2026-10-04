'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { TaskItem } from '@/types';
import {
  Heart,
  CheckSquare,
  Calendar,
  Sparkles,
  Users,
  Send,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquareHeart,
  Lock,
  Share2,
  Trash2,
  GraduationCap,
  ArrowRight,
  Smile
} from 'lucide-react';

export function HomeView() {
  const {
    currentUser,
    partnerUser,
    tasks,
    exams,
    dailyPartnerNotes,
    saveDailyNote,
    toggleTask,
    addTask,
    deleteExam,
    openLightbox,
    sendEncouragement,
    setActiveView
  } = useLifeOS();

  // Tasks filter: 'MINE' (Personal private) vs 'SHARED' (Collab)
  const [taskTab, setTaskTab] = useState<'MINE' | 'SHARED'>('MINE');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickVisibility, setQuickVisibility] = useState<'PRIVATE' | 'SHARED'>('PRIVATE');

  // Daily Note editor
  const todayStr = new Date().toISOString().split('T')[0];
  const partnerName = partnerUser ? partnerUser.name.split(' ')[0] : 'Partner';
  const myName = currentUser.name.split(' ')[0];

  const noteFromPartner = dailyPartnerNotes.find(
    n => n.fromUserId !== currentUser.id && n.date === todayStr
  );
  const myNoteToPartner = dailyPartnerNotes.find(
    n => n.fromUserId === currentUser.id && n.date === todayStr
  );

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(myNoteToPartner?.note || '');
  const [noteEmoji, setNoteEmoji] = useState(myNoteToPartner?.moodEmoji || '💌');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Quick Encouragement feedback
  const [encouragementSent, setEncouragementSent] = useState(false);

  // Filter tasks with strict personal vs shared separation
  const personalTasks = tasks.filter(
    t => t.creatorId === currentUser.id && t.status !== 'COMPLETED'
  );
  const sharedTasks = tasks.filter(
    t => t.visibility === 'SHARED' && t.status !== 'COMPLETED'
  );

  const currentDisplayTasks = taskTab === 'MINE' ? personalTasks : sharedTasks;
  const myExams = exams.filter(e => e.userId === currentUser.id);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    saveDailyNote(noteDraft.trim(), noteEmoji);
    setIsEditingNote(false);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 3000);
  };

  const handleToggleTaskWithProof = (task: TaskItem) => {
    if (task.status !== 'COMPLETED' && task.proofRequired && !task.proof) {
      alert(`"${task.title}" requires photo verification to complete. Opening Tasks view to attach proof.`);
      setActiveView('TASKS');
      return;
    }
    toggleTask(task.id);
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      description: quickVisibility === 'PRIVATE' ? 'Personal private task' : 'Shared collab task',
      category: 'Study',
      priority: 'NORMAL',
      visibility: quickVisibility,
      status: 'TODO',
      dueDate: todayStr,
      dueTime: '18:00',
      recurrence: 'NONE',
      estimatedMinutes: 30,
      proofRequired: false,
      assignedToId: currentUser.id
    });

    setQuickTitle('');
  };

  const handleSendQuickEncourage = (emoji: string, text: string) => {
    sendEncouragement(text, emoji);
    setEncouragementSent(true);
    setTimeout(() => setEncouragementSent(false), 2500);
  };

  const getExamCountdown = (dateStr: string) => {
    if (!dateStr) return { label: 'Pending', color: 'bg-muted text-muted-foreground' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d ago`, color: 'bg-muted text-muted-foreground' };
    if (diffDays === 0) return { label: 'Today!', color: 'bg-rose-500/20 text-rose-500 font-extrabold animate-pulse' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold' };
    if (diffDays <= 3) return { label: `${diffDays} days left`, color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold' };
    if (diffDays <= 7) return { label: `${diffDays} days left`, color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold' };
    return { label: `${diffDays} days left`, color: 'bg-primary/10 text-primary font-bold' };
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* 1. Header Greeting & Presence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>{formattedDate}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Good day, {myName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Your personal space & shared private workspace with {partnerName}.
          </p>
        </div>

        {/* Quick status pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-secondary/40 border border-border/60 text-xs">
            <Users className="h-4 w-4 text-primary" />
            <div className="text-left">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Shared Space</div>
              <div className="font-bold text-foreground">{partnerName} & {myName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO FEATURE: NOTE FOR EACH OTHER FOR THE DAY */}
      <div className="rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-500/5 via-card to-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Note for Each Other for Today</h2>
              <p className="text-xs text-muted-foreground">Synced in real-time across your laptop and phone.</p>
            </div>
          </div>

          {noteSavedFeedback && (
            <span className="text-xs font-bold text-emerald-500 animate-in fade-in">
              ✓ Note updated!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Box A: Note FROM Partner */}
          <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">💌</span>
                <span className="text-xs font-bold text-foreground">From {partnerName} to you</span>
              </div>
              {noteFromPartner && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(noteFromPartner.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="py-2 flex-1">
              {noteFromPartner ? (
                <div className="space-y-2">
                  <div className="text-2xl">{noteFromPartner.moodEmoji || '❤️'}</div>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                    &ldquo;{noteFromPartner.note}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-xs space-y-1">
                  <Smile className="h-6 w-6 mx-auto opacity-40" />
                  <p>No note left by {partnerName} yet today.</p>
                  <p className="text-[11px] opacity-75">It will appear here automatically as soon as they write one!</p>
                </div>
              )}
            </div>
          </div>

          {/* Box B: Note TO Partner */}
          <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">✍️</span>
                <span className="text-xs font-bold text-foreground">Your note for {partnerName}</span>
              </div>
              {!isEditingNote && myNoteToPartner && (
                <button
                  onClick={() => {
                    setNoteDraft(myNoteToPartner.note);
                    setNoteEmoji(myNoteToPartner.moodEmoji || '💌');
                    setIsEditingNote(true);
                  }}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="py-2 flex-1">
              {isEditingNote || !myNoteToPartner ? (
                <form onSubmit={handleSaveNote} className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder={`Write a quick thought, loving note, or reminder for ${partnerName} today...`}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-rose-500/30 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {['💌', '❤️', '✨', '💪', '☕', '🌟'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNoteEmoji(emoji)}
                          className={`p-1 text-sm rounded-lg hover:scale-110 transition-transform ${noteEmoji === emoji ? 'bg-rose-500/20 ring-1 ring-rose-500' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {myNoteToPartner && (
                        <button
                          type="button"
                          onClick={() => setIsEditingNote(false)}
                          className="px-2.5 py-1 rounded-xl text-xs text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-xs hover:bg-rose-600 transition-colors"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl">{myNoteToPartner.moodEmoji || '💌'}</div>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                    &ldquo;{myNoteToPartner.note}&rdquo;
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 3. TASKS SECTION: PERSONAL VS SHARED */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span>Today&apos;s Tasks & Deadlines</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {taskTab === 'MINE'
                ? 'Personal Tasks: Strictly private to you, never seen by partner.'
                : `Shared Collab: Synchronized between you and ${partnerName}.`}
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold">
            <button
              onClick={() => { setTaskTab('MINE'); setQuickVisibility('PRIVATE'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                taskTab === 'MINE' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>My Personal ({personalTasks.length})</span>
            </button>
            <button
              onClick={() => { setTaskTab('SHARED'); setQuickVisibility('SHARED'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                taskTab === 'SHARED' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Shared ({sharedTasks.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddQuickTask} className="flex gap-2">
          <input
            type="text"
            placeholder={taskTab === 'MINE' ? "Add a private personal task for today..." : `Add a shared task with ${partnerName}...`}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 p-3 rounded-2xl border border-border bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2 pt-1">
          {currentDisplayTasks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                {taskTab === 'MINE'
                  ? 'No personal tasks currently pending. Add one above!'
                  : 'No shared tasks currently pending. You and your partner are all caught up!'}
              </p>
            </div>
          ) : (
            currentDisplayTasks.map(task => {
              const isOverdue = task.dueDate && new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`) < new Date();
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTaskWithProof(task)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-primary shrink-0"
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span className={`font-semibold text-foreground text-xs sm:text-sm block truncate ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-secondary text-foreground font-medium text-[10px]">
                          {task.category}
                        </span>
                        {task.dueTime && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-amber-500 font-bold' : ''}`}>
                            <Clock className="h-3 w-3" />
                            {task.dueTime}
                          </span>
                        )}
                        {task.visibility === 'PRIVATE' ? (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Private
                          </span>
                        ) : (
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            <Share2 className="h-2.5 w-2.5" /> Shared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {task.proof && (
                    <button
                      onClick={() => openLightbox({
                        url: task.proof!.imageUrl,
                        title: task.title,
                        timestamp: task.proof!.timestamp,
                        aiVerification: task.proof!.aiVerification
                      })}
                      className="text-[11px] font-bold text-primary hover:underline px-2"
                    >
                      View Proof 📷
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={() => setActiveView('TASKS')}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Open Full Tasks & Proof View</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. UPCOMING EXAMS & ACADEMICS */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Upcoming Examinations & Deadlines</h2>
          </div>
          <button
            onClick={() => setActiveView('STUDY')}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Manage Exams in Study</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {myExams.length === 0 ? (
            <div className="col-span-full p-6 rounded-2xl border border-dashed border-border text-center space-y-2">
              <p className="text-xs text-muted-foreground">No upcoming exams added yet.</p>
              <button
                onClick={() => setActiveView('STUDY')}
                className="text-xs font-bold text-primary hover:underline"
              >
                + Add Exam in Study & Exams View
              </button>
            </div>
          ) : (
            myExams.map(exam => {
              const countdown = getExamCountdown(exam.date);
              return (
                <div key={exam.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-foreground text-sm truncate">{exam.subjectName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${countdown.color}`}>
                      {countdown.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Due: {new Date(exam.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${exam.revisionProgress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. QUICK ENCOURAGEMENT FOOTER */}
      <div className="p-5 rounded-3xl border border-border/60 bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />
            Quick Connection with {partnerName}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Send a 1-tap real-time chime notification to your partner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {encouragementSent ? (
            <span className="text-xs font-bold text-primary animate-in fade-in flex items-center gap-1">
              <span>Sent to partner!</span>
              <span>🔥</span>
            </span>
          ) : (
            <>
              <button
                onClick={() => handleSendQuickEncourage('🔥', `You've got this! Keep pushing forward!`)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold hover:border-primary/50 hover:bg-primary/10 transition-colors"
              >
                🔥 You got this!
              </button>
              <button
                onClick={() => handleSendQuickEncourage('💪', `Proud of your discipline and hard work today!`)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
              >
                💪 Keep crushing it
              </button>
              <button
                onClick={() => handleSendQuickEncourage('⚡', `Stay locked in! You are unstoppable today.`)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors"
              >
                ⚡ Stay locked in
              </button>
              <button
                onClick={() => handleSendQuickEncourage('☕', `Remember to drink water and take a quick breather!`)}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors"
              >
                ☕ Hydrate & rest
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
