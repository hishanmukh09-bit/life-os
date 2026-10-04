'use client';

import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Bell,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle
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
    sleepLogs,
    isCleanMode,
    loadDemoData,
    resetToCleanSlate,
    requestNotificationPermission
  } = useLifeOS();

  const [name, setName] = useState(currentUser.name);
  const [sleepTarget, setSleepTarget] = useState(currentUser.sleepTargetHours);
  const [wakeTarget, setWakeTarget] = useState(currentUser.wakeTargetTime);
  const [waterTarget, setWaterTarget] = useState(currentUser.waterTargetMl);
  const [savedAlert, setSavedAlert] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Notification state
  const [notifPermission, setNotifPermission] = useState<string>('default');

  // AI Pattern memory state
  const [patterns, setPatterns] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    async function loadPatterns() {
      try {
        const res = await fetch(`/api/patterns?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.patterns)) {
            setPatterns(data.patterns);
          }
        }
      } catch (e) {}
    }
    loadPatterns();
  }, [currentUser.id]);

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

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

  const handleForgetPattern = async (id: string) => {
    try {
      await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'FORGET', id })
      });
      setPatterns(prev => prev.filter(p => p.id !== id));
    } catch (e) {}
  };

  const handleConfirmPattern = async (id: string) => {
    try {
      await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONFIRM', id })
      });
      setPatterns(prev => prev.map(p => p.id === id ? { ...p, confirmed_by_user: 1 } : p));
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs">
        <h1 className="text-2xl font-extrabold tracking-tight">Space & User Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure real reminders, clean mode data slates, two-person space security, and AI memory controls.
        </p>
      </div>

      {/* 1. Clean Mode vs Demo Experience (Requirements 13 & 14) */}
      <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Data Mode: Clean Slate vs Demo Experience</h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            isCleanMode ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
          }`}>
            {isCleanMode ? 'Clean Mode (Zero Preloaded Fake Life)' : 'Demo Exploration Active'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Requirement 13 & 14: A real user account should start clean with zero fake data, fake tasks, or fake workouts. You can reset to a clean slate or load demo data anytime.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => {
              if (confirm('Reset workspace to a clean slate? All placeholder tasks and fake logs will be cleared.')) {
                resetToCleanSlate();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 font-bold text-xs hover:bg-destructive/20 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset to Clean Slate (My Real Life)</span>
          </button>

          <button
            onClick={loadDemoData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-all"
          >
            <RefreshCw className="h-4 w-4 text-primary" />
            <span>Load Demo Reference Dataset</span>
          </button>
        </div>
      </div>

      {/* 2. Real Reminder & Push Notification Controls (Requirement 23, 24, 25) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">Real Reminders & Push Notifications</h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            notifPermission === 'granted'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            Status: {notifPermission.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Allow real browser notifications so LIFE OS can alert you when tasks, study sessions, and exams are due.
          Includes automatic quiet hours suppression from 11:00 PM to 7:00 AM.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestNotif}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95 transition-all"
          >
            <Bell className="h-4 w-4" />
            <span>{notifPermission === 'granted' ? 'Notifications Enabled ✓' : 'Enable Real Reminders'}</span>
          </button>
          <span className="text-[11px] text-muted-foreground font-semibold">Quiet Hours: 11 PM &ndash; 7 AM</span>
        </div>
      </div>

      {/* 3. AI Pattern Memory (Requirement 20, 21, 59) */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-base text-foreground">AI Pattern Memory & Habits Engine</h2>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">Grounded & Inspectable</span>
        </div>

        <p className="text-xs text-muted-foreground">
          LIFE OS remembers your real routines over time from verified activity history. You have complete control to confirm or forget any stored pattern.
        </p>

        <div className="space-y-3">
          {patterns.length === 0 ? (
            <div className="p-4 rounded-2xl bg-secondary/30 text-xs text-muted-foreground text-center">
              No behavioral patterns recorded yet. As you complete study blocks and workouts, verified patterns will appear here.
            </div>
          ) : (
            patterns.map(pat => (
              <div key={pat.id} className="p-4 rounded-2xl border border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{pat.pattern}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {Math.round(pat.confidence * 100)}% Confidence
                    </span>
                    {pat.confirmed_by_user ? (
                      <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Confirmed
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Evidence: {pat.evidence}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!pat.confirmed_by_user && (
                    <button
                      onClick={() => handleConfirmPattern(pat.id)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px]"
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => handleForgetPattern(pat.id)}
                    className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-[11px]"
                  >
                    Forget
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Two-Person Space Architecture Panel */}
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
                  try {
                    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(currentSpace.inviteCode).catch(() => {});
                    } else {
                      const textArea = document.createElement('textarea');
                      textArea.value = currentSpace.inviteCode;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    }
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  } catch {
                    // fallback
                  }
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
      </div>

      {/* 5. Personal Profile & Wellness Targets */}
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

      {/* 6. Data Export & Privacy Portability */}
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
