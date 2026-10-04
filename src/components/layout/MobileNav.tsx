'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { 
  Home, 
  CheckSquare, 
  Activity, 
  LineChart, 
  Users, 
  Plus, 
  Droplets, 
  Dumbbell, 
  Utensils, 
  Sparkles,
  Smile,
  BookOpen,
  Camera,
  Moon,
  Clock,
  Flame,
  GraduationCap,
  CalendarDays,
  X
} from 'lucide-react';

export function MobileNav() {
  const { activeView, setActiveView, addWater } = useLifeOS();
  const [quickOpen, setQuickOpen] = useState(false);

  const ITEMS = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'TASKS', label: 'Tasks', icon: CheckSquare },
    { id: 'STUDY', label: 'Study', icon: GraduationCap },
    { id: 'CALENDAR', label: 'Calendar', icon: CalendarDays },
    { id: 'US', label: 'Shared', icon: Users },
  ];

  return (
    <>
      {/* Quick Action Floating Menu Modal */}
      {quickOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 sm:hidden">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <span className="text-sm font-bold text-foreground">One-Tap Quick Logging (&lt;10s)</span>
              <button 
                onClick={() => setQuickOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 py-4">
              <button
                onClick={() => { addWater(250); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
              >
                <Droplets className="h-5 w-5" />
                <span className="text-[11px] font-semibold">+250ml Water</span>
              </button>

              <button
                onClick={() => { setActiveView('TASKS'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
              >
                <CheckSquare className="h-5 w-5" />
                <span className="text-[11px] font-semibold">New Task</span>
              </button>

              <button
                onClick={() => { setActiveView('TRACK'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              >
                <Smile className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Check-in</span>
              </button>

              <button
                onClick={() => { setActiveView('WORKOUT'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              >
                <Dumbbell className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Workout</span>
              </button>

              <button
                onClick={() => { setActiveView('FOOD'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
              >
                <Utensils className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Log Meal</span>
              </button>

              <button
                onClick={() => { setActiveView('STUDY'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
              >
                <GraduationCap className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Study Session</span>
              </button>

              <button
                onClick={() => { setActiveView('HABITS'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              >
                <Flame className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Habit</span>
              </button>

              <button
                onClick={() => { setActiveView('TRACK'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
              >
                <Moon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Log Sleep</span>
              </button>

              <button
                onClick={() => { setActiveView('GALLERY'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Photo Proof</span>
              </button>

              <button
                onClick={() => { setActiveView('JOURNAL'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Journal</span>
              </button>

              <button
                onClick={() => { setActiveView('MEMORIES'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[11px] font-semibold">Memory</span>
              </button>

              <button
                onClick={() => { setActiveView('AI_COACH'); setQuickOpen(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-[11px] font-semibold">AI Coach</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
        {ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Plus Action */}
        <button
          onClick={() => setQuickOpen(true)}
          className="flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
          aria-label="One-Tap Quick Logging"
        >
          <Plus className="h-6 w-6" />
        </button>

        {ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
