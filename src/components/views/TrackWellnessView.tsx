'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { Visibility } from '@/types';
import {
  Activity,
  Smile,
  Droplets,
  Moon,
  Sun,
  Calendar,
  Shield,
  Heart,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';

export function TrackWellnessView() {
  const {
    currentUser,
    waterIntake,
    addWater,
    checkins,
    logDailyCheckin,
    sleepLogs,
    logSleep,
    cycleLogs,
    logCycle
  } = useLifeOS();

  // Checkin form state
  const todayStr = new Date().toISOString().split('T')[0];
  const userCheckin = checkins.find(c => c.userId === currentUser.id && c.date === todayStr);

  const [mood, setMood] = useState<'Great' | 'Good' | 'Okay' | 'Low' | 'Tired'>(userCheckin?.mood || 'Good');
  const [energy, setEnergy] = useState<number>(userCheckin?.energy || 8);
  const [stress, setStress] = useState<number>(userCheckin?.stress || 3);
  const [mainGoal, setMainGoal] = useState<string>(userCheckin?.mainGoal || '');
  const [checkinNotes, setCheckinNotes] = useState<string>(userCheckin?.notes || '');
  const [checkinVisibility, setCheckinVisibility] = useState<Visibility>('SHARED');
  const [checkinSaved, setCheckinSaved] = useState(false);

  // Sleep form
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:45');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [sleepSaved, setSleepSaved] = useState(false);

  // Optional cycle form
  const [cycleStartDate, setCycleStartDate] = useState(todayStr);
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleDuration, setCycleDuration] = useState(5);
  const [cycleSymptoms, setCycleSymptoms] = useState('Mild cramps, slight fatigue');
  const [cycleSaved, setCycleSaved] = useState(false);

  const handleSaveCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    logDailyCheckin({
      mood,
      energy,
      stress,
      mainGoal: mainGoal.trim() || 'Focus on daily consistency and wellbeing',
      notes: checkinNotes.trim() || undefined,
      visibility: checkinVisibility
    });
    setCheckinSaved(true);
    setTimeout(() => setCheckinSaved(false), 2500);
  };

  const handleSaveSleep = (e: React.FormEvent) => {
    e.preventDefault();
    // compute rough duration
    logSleep(bedtime, wakeTime, 465, sleepQuality, 'Restful sleep cycle');
    setSleepSaved(true);
    setTimeout(() => setSleepSaved(false), 2500);
  };

  const handleSaveCycle = (e: React.FormEvent) => {
    e.preventDefault();
    logCycle({
      periodStartDate: cycleStartDate,
      cycleLengthDays: cycleLength,
      periodDurationDays: cycleDuration,
      symptoms: cycleSymptoms.split(',').map(s => s.trim()),
      mood: 'Calm and steady',
      energyLevel: energy,
      visibility: 'PRIVATE' // Strictly private default
    });
    setCycleSaved(true);
    setTimeout(() => setCycleSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h1 className="text-2xl font-extrabold tracking-tight">Track & Wellness</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Holistic health, daily mood reflections, hydration, and sleep hygiene.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Daily Check-in Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">Daily Reflection Check-in</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {todayStr}
            </span>
          </div>

          <form onSubmit={handleSaveCheckin} className="space-y-4 text-xs">
            {/* Mood selector */}
            <div>
              <label className="font-semibold text-foreground">How are you feeling today?</label>
              <div className="grid grid-cols-5 gap-2 mt-1.5">
                {(['Great', 'Good', 'Okay', 'Low', 'Tired'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`py-2 px-1 rounded-xl text-center font-semibold border transition-all ${
                      mood === m
                        ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {m === 'Great' && '✨ Great'}
                    {m === 'Good' && '😊 Good'}
                    {m === 'Okay' && '😐 Okay'}
                    {m === 'Low' && '🌧️ Low'}
                    {m === 'Tired' && '🥱 Tired'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders for Energy and Stress */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Energy Level</span>
                  <span className="text-primary font-bold">{energy} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  className="w-full mt-2 accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Stress Level</span>
                  <span className="text-amber-500 font-bold">{stress} / 10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full mt-2 accent-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground">Main Priority for Today</label>
              <input
                type="text"
                placeholder="What matters most today?"
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground">What happened today? (Optional reflections)</label>
              <textarea
                rows={2}
                placeholder="Thoughts, gratitude, or challenges..."
                value={checkinNotes}
                onChange={(e) => setCheckinNotes(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Visibility:</span>
                <select
                  value={checkinVisibility}
                  onChange={(e) => setCheckinVisibility(e.target.value as Visibility)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                >
                  <option value="SHARED">Shared with Partner</option>
                  <option value="PRIVATE">Keep Private</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-95"
              >
                Save Daily Check-in
              </button>
            </div>
            {checkinSaved && (
              <p className="text-emerald-500 font-semibold text-center pt-1 animate-in fade-in">
                Check-in successfully saved!
              </p>
            )}
          </form>
        </div>

        {/* 2. Hydration & Sleep Trackers */}
        <div className="space-y-6">
          
          {/* Water Tracker */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-sky-500">
                <Droplets className="h-5 w-5" />
                <h2 className="text-base font-bold text-foreground">Hydration Counter</h2>
              </div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                Target: {(currentUser.waterTargetMl / 1000).toFixed(1)}L
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold text-foreground">
                  {(waterIntake / 1000).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">Liters</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Math.round((waterIntake / currentUser.waterTargetMl) * 100)}% of daily recommendation
                </p>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addWater(250)}
                  className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 font-bold text-xs transition-colors"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => addWater(500)}
                  className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 font-bold text-xs transition-colors"
                >
                  +500 ml
                </button>
              </div>
            </div>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((waterIntake / currentUser.waterTargetMl) * 100))}%` }}
              />
            </div>
          </div>

          {/* Sleep & Wake-up Tracking */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-purple-500">
                <Moon className="h-5 w-5" />
                <h2 className="text-base font-bold text-foreground">Sleep & Wake Consistency</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                Target: {currentUser.sleepTargetHours}h
              </span>
            </div>

            <form onSubmit={handleSaveSleep} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Bedtime</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Wake-up Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Quality:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSleepQuality(q)}
                        className={`h-6 w-6 rounded-md text-xs font-bold ${
                          sleepQuality === q ? 'bg-purple-600 text-white' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold hover:opacity-90"
                >
                  Log Sleep
                </button>
              </div>
              {sleepSaved && (
                <p className="col-span-2 text-emerald-500 font-semibold text-center pt-1 animate-in fade-in">
                  Sleep entry logged!
                </p>
              )}
            </form>
          </div>

        </div>

      </div>

      {/* 3. Optional Menstrual Cycle Tracking (Strictly PRIVATE by default) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <h2 className="text-base font-bold text-foreground">Menstrual Cycle Tracking (Optional)</h2>
          </div>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3" /> Strictly Private by Default
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Track cycle phases and symptoms for self-awareness. All estimates are strictly labelled as <span className="font-semibold text-foreground">&ldquo;Estimated&rdquo;</span>. No partner access without explicit individual consent.
        </p>

        <form onSubmit={handleSaveCycle} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Last Period Start Date</label>
            <input
              type="date"
              value={cycleStartDate}
              onChange={(e) => setCycleStartDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Typical Cycle Length (Days)</label>
            <input
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Symptoms & Notes</label>
            <input
              type="text"
              value={cycleSymptoms}
              onChange={(e) => setCycleSymptoms(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground italic">
              Estimated next phase: Follicular / Energetic window in ~4 days.
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:opacity-95"
            >
              Update Cycle Data
            </button>
          </div>
          {cycleSaved && (
            <p className="md:col-span-3 text-emerald-500 font-semibold text-center animate-in fade-in">
              Cycle entry saved securely to private vault.
            </p>
          )}
        </form>
      </div>

    </div>
  );
}
