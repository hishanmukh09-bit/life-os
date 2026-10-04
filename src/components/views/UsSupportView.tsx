'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { HelpRequest } from '@/types';
import {
  Heart,
  Send,
  LifeBuoy,
  MessageCircle,
  Sparkles,
  Shield,
  Smile,
  Zap,
  Coffee,
  Award,
  CheckCircle2
} from 'lucide-react';

const HELP_CATEGORIES: HelpRequest['category'][] = [
  'Study',
  'Workout',
  'Productivity',
  'Technical',
  'Time management',
  'Feeling overwhelmed',
  'Food',
  'Just need someone'
];

export function UsSupportView() {
  const {
    currentUser,
    partnerUser,
    encouragements,
    checkins,
    sendEncouragement,
    requestHelp
  } = useLifeOS();

  const [customEncouragement, setCustomEncouragement] = useState('');
  const [helpCategory, setHelpCategory] = useState<HelpRequest['category']>('Study');
  const [helpNote, setHelpNote] = useState('');
  const [sentAlert, setSentAlert] = useState<string | null>(null);

  // Partner's shared checkin if available
  const todayStr = new Date().toISOString().split('T')[0];
  const partnerCheckin = checkins.find(c => c.userId === partnerUser?.id && c.date === todayStr && c.visibility === 'SHARED');

  const handleSendEncouragement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEncouragement.trim()) return;

    sendEncouragement(customEncouragement.trim(), 'Note');
    setCustomEncouragement('');
    setSentAlert('Encouragement sent successfully.');
    setTimeout(() => setSentAlert(null), 3000);
  };

  const handleSendQuick = (tag: string, msg: string) => {
    sendEncouragement(msg, tag);
    setSentAlert('Encouragement sent successfully.');
    setTimeout(() => setSentAlert(null), 3000);
  };

  const handleTriggerHelp = (e: React.FormEvent) => {
    e.preventDefault();
    requestHelp(helpCategory, helpNote.trim() || undefined);
    setHelpNote('');
    setSentAlert(`Gentle help request sent for ${helpCategory}.`);
    setTimeout(() => setSentAlert(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Us & Mutual Support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Supportive accountability without invasive surveillance or guilt mechanics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Private Space Partner: {partnerUser?.name.split(' ')[0] || 'Partner'}
          </span>
        </div>
      </div>

      {sentAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{sentAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. CHECK ON THEM (Only explicitly shared info) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="h-5 w-5" />
              <h2 className="text-base font-bold text-foreground">
                Check on {partnerUser?.name.split(' ')[0] || 'Partner'}
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500" /> Explicitly shared only
            </span>
          </div>

          {partnerCheckin ? (
            <div className="p-4 rounded-2xl bg-secondary/30 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Today&apos;s Mood:</span>
                <span className="font-bold text-foreground">{partnerCheckin.mood}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Energy:</span>
                <span className="font-bold text-primary">{partnerCheckin.energy} / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Main Goal:</span>
                <span className="font-semibold text-foreground">{partnerCheckin.mainGoal}</span>
              </div>
              {partnerCheckin.notes && (
                <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40">
                  &ldquo;{partnerCheckin.notes}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-secondary/20 text-xs text-muted-foreground">
              Partner has logged into the Sanctuary today. No private reflection shared.
            </div>
          )}

          {/* Quick Encouragements */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-foreground">Send Quick Note:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSendQuick('Standing with you', "You've got this! One step at a time.")}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-rose-500/10 hover:border-rose-500/40 text-left font-medium transition-all"
              >
                <Zap className="h-4 w-4 text-rose-500 shrink-0" />
                <span>You&apos;ve got this</span>
              </button>
              <button
                onClick={() => handleSendQuick('Break', 'Take a gentle break, you’ve worked hard.')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-amber-500/10 hover:border-amber-500/40 text-left font-medium transition-all"
              >
                <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Take a break</span>
              </button>
              <button
                onClick={() => handleSendQuick('Proud', 'I am proud of your consistency today.')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-indigo-500/10 hover:border-indigo-500/40 text-left font-medium transition-all"
              >
                <Award className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Proud of you</span>
              </button>
              <button
                onClick={() => handleSendQuick('Support', 'Let me know if you need a hand with anything!')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left font-medium transition-all"
              >
                <LifeBuoy className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Need a hand?</span>
              </button>
            </div>
          </div>

          {/* Custom Message Form */}
          <form onSubmit={handleSendEncouragement} className="space-y-2 pt-2 border-t border-border/50 text-xs">
            <label className="font-semibold text-foreground">Or send a personalized note:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Write something kind..."
                value={customEncouragement}
                onChange={(e) => setCustomEncouragement(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shrink-0"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* 2. I NEED HELP Beacon & Encouragement Feed */}
        <div className="space-y-6">
          
          {/* I Need Help Beacon */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 text-indigo-500">
                <LifeBuoy className="h-5 w-5" />
                <h2 className="text-base font-bold text-foreground">I Need Help</h2>
              </div>
              <span className="text-xs text-muted-foreground">Gentle beacon</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Feeling stuck or overwhelmed? Tap below to send a gentle notification to your partner without guilt or pressure.
            </p>

            <form onSubmit={handleTriggerHelp} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Category</label>
                <select
                  value={helpCategory}
                  onChange={(e) => setHelpCategory(e.target.value as HelpRequest['category'])}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                >
                  {HELP_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Optional note</label>
                <input
                  type="text"
                  placeholder="e.g. Could use fresh eyes on problem set or a quick coffee break"
                  value={helpNote}
                  onChange={(e) => setHelpNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95"
              >
                Notify Partner: &ldquo;I Need Help&rdquo;
              </button>
            </form>
          </div>

          {/* Encouragements Feed */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Shared Encouragements Log
            </h3>

            <div className="space-y-2 pt-1">
              {encouragements.map((enc) => (
                <div key={enc.id} className="p-3 rounded-2xl bg-secondary/30 border border-border/50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{enc.fromUserName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(enc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-foreground flex items-center gap-1.5">
                    {enc.emoji && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">{enc.emoji.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, '') || 'Note'}</span>
                    )}
                    <span>{enc.message}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
