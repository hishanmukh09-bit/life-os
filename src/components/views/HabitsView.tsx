'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { Habit } from '@/types';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Heart,
  TrendingUp,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export function HabitsView() {
  const { currentUser, habits, toggleHabit, addHabit } = useLifeOS();

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [newFreq, setNewFreq] = useState<Habit['frequency']>('DAILY');
  const [showAdd, setShowAdd] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit(newTitle.trim(), newCategory, newFreq);
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Habit Architecture</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sustainable micro-consistencies without shame or punitive mechanics.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Gentle Recovery Philosophy Callout */}
      <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-card to-card border border-amber-500/20 text-xs text-muted-foreground flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <RotateCcw className="h-4 w-4" />
        </div>
        <div>
          <span className="font-bold text-foreground">Habit Recovery Principle: </span>
          <span>&ldquo;One missed day doesn&apos;t erase your progress.&rdquo; Consistency is about returning calmly, not punishing mistakes.</span>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => {
          const isDoneToday = habit.logs.some(l => l.date === todayStr && l.completed);

          return (
            <div
              key={habit.id}
              className={`p-5 rounded-3xl border transition-all ${
                isDoneToday
                  ? 'border-amber-500/40 bg-card shadow-xs'
                  : 'border-border bg-card hover:border-border/80 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                    {habit.category} &bull; {habit.frequency}
                  </span>
                  <h3 className="text-base font-bold text-foreground pt-1">{habit.title}</h3>
                </div>

                <button
                  onClick={() => toggleHabit(habit.id)}
                  className="mt-1 transition-transform active:scale-95"
                >
                  {isDoneToday ? (
                    <CheckCircle2 className="h-7 w-7 text-amber-500 fill-amber-500/20" />
                  ) : (
                    <Circle className="h-7 w-7 text-muted-foreground hover:text-amber-500" />
                  )}
                </button>
              </div>

              {/* Streaks & Recovery count */}
              <div className="flex items-center gap-4 pt-4 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-500">
                  <Flame className="h-4 w-4 fill-current" />
                  <span>{habit.currentStreak} day streak</span>
                </div>
                <div className="text-muted-foreground">
                  Best: <span className="font-semibold text-foreground">{habit.bestStreak} days</span>
                </div>
                {habit.recoveryCount > 0 && (
                  <div className="text-muted-foreground">
                    Recoveries: <span className="font-semibold text-foreground">{habit.recoveryCount}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Habit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Create New Habit</h3>
            <form onSubmit={handleAddHabit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 minutes sunlight exposure"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="Health">Health</option>
                    <option value="Study">Study</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Productivity">Productivity</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Frequency</label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value as Habit['frequency'])}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKDAYS">Weekdays</option>
                    <option value="WEEKENDS">Weekends</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
