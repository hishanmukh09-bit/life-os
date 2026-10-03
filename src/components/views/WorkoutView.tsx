'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
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
  Calendar
} from 'lucide-react';

const WORKOUT_TYPES: WorkoutLog['type'][] = [
  'Strength',
  'Cardio',
  'Walking',
  'Running',
  'Cycling',
  'Mobility',
  'Yoga',
  'Bodyweight',
  'Gym',
  'Sports'
];

export function WorkoutView() {
  const { currentUser, workouts, addWorkout } = useLifeOS();

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

  const handleGenerateAIRoutine = () => {
    setAiRoutineModal(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Movement & Workouts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log exercises, track progressive overload, and generate balanced routines.
          </p>
        </div>

        <button
          onClick={handleGenerateAIRoutine}
          className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Workout Routine</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log New Workout Form */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Log Training Session
          </h2>

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
                  <option value="PRIVATE">Keep Private</option>
                </select>
              </div>
            </div>

            {/* Exercise Sets Builder */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <label className="font-semibold text-foreground">Exercises / Movements</label>
              
              <div className="space-y-1.5">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 text-xs">
                    <span className="font-bold text-foreground">{ex.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{ex.sets} sets &times; {ex.reps} reps</span>
                      {ex.weightKg !== undefined && <span className="font-semibold text-primary">{ex.weightKg} kg</span>}
                      <button
                        type="button"
                        onClick={() => removeExerciseRow(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add exercise inputs */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                />
                <input
                  type="number"
                  placeholder="Sets"
                  value={newExSets}
                  onChange={(e) => setNewExSets(parseInt(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded-xl border border-border bg-background text-xs text-center"
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={newExReps}
                  onChange={(e) => setNewExReps(parseInt(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded-xl border border-border bg-background text-xs text-center"
                />
                <input
                  type="number"
                  placeholder="Kg"
                  value={newExWeight}
                  onChange={(e) => setNewExWeight(parseInt(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded-xl border border-border bg-background text-xs text-center"
                />
                <button
                  type="button"
                  onClick={addExerciseRow}
                  className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 font-bold text-xs"
                >
                  + Add
                </button>
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
            Recent Logs
          </h2>

          <div className="space-y-3">
            {workouts.map(wo => (
              <div key={wo.id} className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {wo.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{wo.durationMinutes} mins</span>
                </div>
                <div className="space-y-1 text-xs">
                  {wo.exercises.map((ex, i) => (
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
            ))}
          </div>
        </div>

      </div>

      {/* AI Routine Builder Modal */}
      {aiRoutineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
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
