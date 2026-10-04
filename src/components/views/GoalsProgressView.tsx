'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { Goal } from '@/types';
import {
  Target,
  Plus,
  Users,
  CheckCircle2,
  Circle,
  TrendingUp,
  LineChart,
  Calendar,
  Sparkles,
  Heart,
  Award
} from 'lucide-react';

export function GoalsProgressView() {
  const {
    currentUser,
    partnerUser,
    goals,
    addGoal,
    toggleMilestone,
    achievements
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'US' | 'ME' | 'TRENDS'>('US');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('Academics');
  const [targetDate, setTargetDate] = useState('2026-11-01');
  const [isShared, setIsShared] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const usGoals = goals.filter(g => g.isShared);
  const meGoals = goals.filter(g => !g.isShared && g.creatorId === currentUser.id);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addGoal({
      title: newTitle.trim(),
      category: newCategory,
      targetDate,
      isShared,
      visibility: isShared ? 'SHARED' : 'PRIVATE',
      milestones: [
        { id: 'm_' + Date.now(), title: 'Phase 1: Foundation setup', completed: false },
        { id: 'm_' + (Date.now() + 1), title: 'Phase 2: Core execution milestones', completed: false }
      ]
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Goals & Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Long-term shared horizon, personal milestones, and non-judgmental growth trends.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Me / Us / Trends Tab Switcher */}
      <div className="flex items-center rounded-2xl bg-muted/50 p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('US')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'US' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Heart className="h-4 w-4 text-rose-500" />
          <span>US Goals ({usGoals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ME')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'ME' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Target className="h-4 w-4 text-primary" />
          <span>My Goals ({meGoals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRENDS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'TRENDS' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>Becoming Better (Trends)</span>
        </button>
      </div>

      {/* US Goals Section */}
      {activeTab === 'US' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-3">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="font-bold text-foreground">Collaborative Growth: </span>
              Combined achievements for both of you. Never ranked, always supportive.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usGoals.map((goal) => (
              <div key={goal.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase">
                      US GOAL &bull; {goal.category}
                    </span>
                    <h3 className="text-base font-bold text-foreground pt-1">{goal.title}</h3>
                    {goal.description && <p className="text-xs text-muted-foreground">{goal.description}</p>}
                  </div>
                  <span className="text-sm font-extrabold text-primary">{goal.progress}%</span>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-rose-500 to-primary rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                {/* Milestones list */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Milestones</span>
                  {goal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestone(goal.id, m.id)}
                      className="flex items-center gap-2.5 text-xs cursor-pointer hover:text-foreground text-muted-foreground transition-colors"
                    >
                      {m.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ME Goals Section */}
      {activeTab === 'ME' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meGoals.map((goal) => (
            <div key={goal.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                    {goal.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground pt-1">{goal.title}</h3>
                </div>
                <span className="text-sm font-extrabold text-primary">{goal.progress}%</span>
              </div>

              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                {goal.milestones.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => toggleMilestone(goal.id, m.id)}
                    className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={m.completed ? 'line-through' : 'text-foreground'}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRENDS & BECOMING BETTER Section */}
      {activeTab === 'TRENDS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl border border-border bg-card space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Study Consistency</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                &uarr; 18%
              </div>
              <p className="text-xs text-muted-foreground">Compared to previous 30-day baseline</p>
            </div>

            <div className="p-5 rounded-3xl border border-border bg-card space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Workout Frequency</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                &uarr; 25%
              </div>
              <p className="text-xs text-muted-foreground">Consistent 4 sessions per week cadence</p>
            </div>

            <div className="p-5 rounded-3xl border border-border bg-card space-y-1">
              <span className="text-xs text-muted-foreground font-semibold">Sleep Consistency</span>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                &rarr; Stable
              </div>
              <p className="text-xs text-muted-foreground">Average wake deviation: &plusmn;18 mins</p>
            </div>
          </div>

          {/* Tasteful Achievements */}
          <div className="p-6 rounded-3xl border border-border bg-card space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Tasteful Milestones Unlocked
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1 text-xs">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-foreground pt-1">{ach.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{ach.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create New Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 combined study & workout sessions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Goal Scope</label>
                  <select
                    value={isShared ? 'US' : 'ME'}
                    onChange={(e) => setIsShared(e.target.value === 'US')}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="US">US Goal (Shared Together)</option>
                    <option value="ME">Personal Goal (Me)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
