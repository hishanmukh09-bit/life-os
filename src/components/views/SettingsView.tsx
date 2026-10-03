'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Settings,
  User,
  Shield,
  Download,
  Trash2,
  Copy,
  Check,
  Moon,
  Sun,
  Users,
  AlertTriangle
} from 'lucide-react';

export function SettingsView() {
  const {
    currentUser,
    currentSpace,
    partnerUser,
    updateProfile,
    tasks,
    habits,
    workouts,
    sleepLogs
  } = useLifeOS();

  const [name, setName] = useState(currentUser.name);
  const [sleepTarget, setSleepTarget] = useState(currentUser.sleepTargetHours);
  const [wakeTarget, setWakeTarget] = useState(currentUser.wakeTargetTime);
  const [waterTarget, setWaterTarget] = useState(currentUser.waterTargetMl);
  const [savedAlert, setSavedAlert] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      sleepTargetHours: sleepTarget,
      wakeTargetTime: wakeTarget,
      waterTargetMl: waterTarget
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleExportData = () => {
    const exportPayload = {
      user: currentUser,
      space: {
        id: currentSpace.id,
        name: currentSpace.name,
        membersCount: currentSpace.members.length
      },
      tasks: tasks.filter(t => t.creatorId === currentUser.id),
      habits: habits.filter(h => h.userId === currentUser.id),
      workouts: workouts.filter(w => w.userId === currentUser.id),
      sleepLogs: sleepLogs.filter(s => s.userId === currentUser.id),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos_data_${currentUser.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h1 className="text-2xl font-extrabold tracking-tight">Space & User Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure wellness targets, private space security, and personal data portability.
        </p>
      </div>

      {/* 1. Two-Person Space Architecture Panel */}
      <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Two-Person Private Space Status</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Active & Secure
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-secondary/30 space-y-1">
            <span className="text-muted-foreground">Space Name</span>
            <div className="text-base font-bold text-foreground">{currentSpace.name}</div>
            <p className="text-[11px] text-muted-foreground">Owner: {currentSpace.members.find(m => m.role === 'OWNER')?.name}</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 space-y-1">
            <span className="text-muted-foreground">Invitation Code (Strictly 2 Members Max)</span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-mono text-lg font-bold tracking-widest text-primary">{currentSpace.inviteCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentSpace.inviteCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted"
                title="Copy Code"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Third party join attempts are rejected at the server level.</p>
          </div>
        </div>

        {/* Current Members List */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-foreground uppercase text-[10px]">Registered Space Members (2/2)</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentSpace.members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-background text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground block">{m.email}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Profile & Wellness Targets */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profile & Daily Targets
        </h2>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-foreground">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Wake Target Time</label>
            <input
              type="time"
              value={wakeTarget}
              onChange={(e) => setWakeTarget(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Sleep Target (Hours)</label>
            <input
              type="number"
              value={sleepTarget}
              onChange={(e) => setSleepTarget(parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground">Daily Hydration Target (mL)</label>
            <input
              type="number"
              value={waterTarget}
              onChange={(e) => setWaterTarget(parseInt(e.target.value))}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-border/50">
            {savedAlert ? (
              <span className="text-xs font-semibold text-emerald-500 animate-in fade-in">
                Preferences updated successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:opacity-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* 3. Data Export & Privacy Portability */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Data Export & Portability</h2>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Download a complete, offline JSON copy of your personal tasks, habits, workout sessions, and sleep records anytime.
        </p>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 font-bold text-xs text-foreground transition-all"
        >
          <Download className="h-4 w-4 text-primary" />
          <span>Export My Personal Data (JSON)</span>
        </button>
      </div>

    </div>
  );
}
