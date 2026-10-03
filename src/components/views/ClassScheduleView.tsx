'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { ClassScheduleItem } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  BookOpen,
  GraduationCap
} from 'lucide-react';

const DAYS: ClassScheduleItem['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ClassScheduleView() {
  const { classSchedule, addClassScheduleItem } = useLifeOS();

  const [showAdd, setShowAdd] = useState(false);
  const [day, setDay] = useState<ClassScheduleItem['day']>('Monday');
  const [subjectName, setSubjectName] = useState('');
  const [room, setRoom] = useState('Hall 402');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [color, setColor] = useState('#6366f1');

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    addClassScheduleItem({
      day,
      subjectName: subjectName.trim(),
      room: room.trim() || undefined,
      startTime,
      endTime,
      color
    });

    setSubjectName('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">University Class Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weekly academic schedule integrated with daily AI planner to prevent conflicting task blocks.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Class Block</span>
        </button>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((d) => {
          const dayClasses = classSchedule.filter(c => c.day === d);
          return (
            <div key={d} className="rounded-3xl border border-border bg-card p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="font-bold text-sm text-foreground">{d}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                  {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              {dayClasses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  No scheduled lecture blocks
                </p>
              ) : (
                <div className="space-y-2.5">
                  {dayClasses.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl border border-border/70 bg-secondary/30 space-y-1.5 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-foreground">{item.subjectName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" /> {item.startTime} &ndash; {item.endTime}
                        </span>
                        {item.room && (
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <MapPin className="h-3 w-3" /> {item.room}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Add Class Schedule Block</h3>
            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as ClassScheduleItem['day'])}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">Course / Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Vision Perception"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">Room / Lecture Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 402 or Engineering Lab B"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
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
                  Save Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
