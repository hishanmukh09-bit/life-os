'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Heart,
  AlertCircle
} from 'lucide-react';

export function SharedCalendarView() {
  const { events, exams, tasks, trips, partnerUser } = useLifeOS();
  const [currentMonth, setCurrentMonth] = useState('October 2026');

  // Days of current month (October 2026: starts on Thursday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Map events to day numbers in October
  const getDayItems = (day: number) => {
    const items: { title: string; type: 'TASK' | 'EXAM' | 'EVENT' | 'TRIP'; color: string }[] = [];
    if (day === 4) items.push({ title: 'Robotics PS4 due', type: 'TASK', color: 'bg-indigo-500' });
    if (day === 7) items.push({ title: 'Problem Set #4 Deadline', type: 'TASK', color: 'bg-rose-500' });
    if (day === 16) items.push({ title: 'Robotics Midterm Exam', type: 'EXAM', color: 'bg-amber-500' });
    if (day === 24) {
      items.push({ title: '2-Year Anniversary Dinner', type: 'EVENT', color: 'bg-rose-500' });
      items.push({ title: 'Mt. Rainier Weekend Trip', type: 'TRIP', color: 'bg-emerald-500' });
    }
    if (day === 25) items.push({ title: 'Rainier Skyline Trail Hike', type: 'TRIP', color: 'bg-emerald-500' });
    return items;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shared Space Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synchronized schedule for exams, assignments, trips, and shared anniversary celebrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-bold text-sm px-3">{currentMonth}</span>
          <button className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground pb-2 border-b border-border/50 uppercase">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 31 days with 4 leading offset cells for Thursday start */}
        <div className="grid grid-cols-7 gap-2 text-xs">
          {[null, null, null, null].map((_, i) => (
            <div key={'empty_' + i} className="h-24 rounded-2xl bg-secondary/10 opacity-30" />
          ))}

          {daysInMonth.map((d) => {
            const items = getDayItems(d);
            const isToday = d === 4;
            return (
              <div
                key={d}
                className={`h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isToday
                    ? 'border-primary bg-primary/5 shadow-2xs'
                    : 'border-border/60 bg-background hover:border-border'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${isToday ? 'h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs' : 'text-foreground'}`}>
                    {d}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {items.slice(0, 2).map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md truncate ${item.color}`}
                    >
                      {item.title}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      +{items.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
