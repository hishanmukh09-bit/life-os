'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/store';
import { GoogleCalendarService, CalendarEventPayload } from '@/lib/google-calendar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Heart,
  AlertCircle,
  Download,
  ExternalLink,
  CheckCircle2,
  Share2,
  CalendarCheck,
  ShieldCheck,
  Plus
} from 'lucide-react';

export function SharedCalendarView() {
  const { currentUser, events, exams, tasks, trips, partnerUser } = useLifeOS();
  const [currentMonth, setCurrentMonth] = useState('October 2026');
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsGCalConnected(GoogleCalendarService.isGoogleCalendarConnected());
  }, []);

  const handleConnectGCal = () => {
    GoogleCalendarService.setGoogleCalendarConnected(true);
    setIsGCalConnected(true);
    setShowPermissionModal(false);
    setSyncFeedback('Google Calendar permissions authorized! Real-time 1-click sync enabled.');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleDisconnectGCal = () => {
    GoogleCalendarService.setGoogleCalendarConnected(false);
    setIsGCalConnected(false);
    setSyncFeedback('Google Calendar sync disconnected.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Days of current month (October 2026: starts on Thursday)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Map real tasks, exams, trips, and events to day numbers in October 2026
  const getDayItems = (day: number) => {
    const dayStr = `2026-10-${String(day).padStart(2, '0')}`;
    const items: {
      id: string;
      title: string;
      type: 'TASK' | 'EXAM' | 'EVENT' | 'TRIP';
      color: string;
      time?: string;
      rawDate: string;
      description?: string;
    }[] = [];

    // Real tasks: only current user's tasks or shared tasks
    tasks.forEach(t => {
      const isAccessible = t.creatorId === currentUser.id || t.visibility === 'SHARED';
      if (isAccessible && t.dueDate === dayStr) {
        items.push({
          id: t.id,
          title: t.title,
          type: 'TASK',
          color: (t.priority === 'MUST_DO' || t.priority === 'HIGH') ? 'bg-rose-500' : 'bg-indigo-500',
          time: t.dueTime,
          rawDate: t.dueDate,
          description: `Task Priority: ${t.priority}. Category: ${t.category}`
        });
      }
    });

    // Real exams: strictly personal to current student
    exams.forEach(e => {
      if (e.userId === currentUser.id && e.date === dayStr) {
        items.push({
          id: e.id,
          title: `${e.subjectName} Exam`,
          type: 'EXAM',
          color: 'bg-amber-500',
          time: '09:00',
          rawDate: e.date,
          description: `Exam Topics: ${e.topics?.join(', ') || 'All topics'}. Difficulty: ${e.difficulty}. Revision: ${e.revisionProgress}%`
        });
      }
    });

    // Real trips
    trips.forEach(tr => {
      if (tr.startDate === dayStr || tr.endDate === dayStr) {
        items.push({
          id: tr.id,
          title: tr.destination,
          type: 'TRIP',
          color: 'bg-emerald-500',
          rawDate: tr.startDate,
          description: `Trip to ${tr.destination}. Packing items: ${tr.packingList?.length || 0}`
        });
      }
    });

    return items;
  };

  const handleExportIcs = () => {
    const allEvents: CalendarEventPayload[] = [];
    for (let d = 1; d <= 31; d++) {
      const items = getDayItems(d);
      for (const item of items) {
        allEvents.push({
          title: item.title,
          description: item.description,
          startDate: item.rawDate,
          startTime: item.time
        });
      }
    }
    GoogleCalendarService.downloadIcsFile('LifeOS_Shared_Calendar_October_2026', allEvents);
    setSyncFeedback('Downloaded calendar (.ics). Open on your phone or laptop to import all events directly!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleSyncItemToGCal = (item: { title: string; rawDate: string; time?: string; description?: string }) => {
    GoogleCalendarService.openInGoogleCalendar({
      title: item.title,
      description: item.description,
      startDate: item.rawDate,
      startTime: item.time
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Shared Space Calendar</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              Google Calendar Ready
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Synchronized schedule for exams, assignments, trips, and shared events with Google Calendar permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Google Calendar Permission & Connect Button */}
          {isGCalConnected ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Google Calendar Connected</span>
              <button
                onClick={handleDisconnectGCal}
                title="Disconnect Google Calendar permissions"
                className="ml-1 text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPermissionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Connect Google Calendar</span>
            </button>
          )}

          {/* Export .ics button */}
          <button
            onClick={handleExportIcs}
            title="Download .ics calendar feed for Google Calendar, Apple Calendar, or Outlook"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-border bg-secondary hover:bg-muted font-bold text-xs text-foreground transition-colors"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export (.ics)</span>
          </button>

          <div className="flex items-center gap-1 ml-2">
            <button className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm px-2">{currentMonth}</span>
            <button className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

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
            <div key={'empty_' + i} className="h-28 rounded-2xl bg-secondary/10 opacity-30" />
          ))}

          {daysInMonth.map((d) => {
            const items = getDayItems(d);
            const isToday = d === 4;
            return (
              <div
                key={d}
                className={`h-28 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
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
                    <span className="text-[10px] text-muted-foreground font-semibold">{items.length}</span>
                  )}
                </div>

                <div className="space-y-1 overflow-hidden my-1">
                  {items.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSyncItemToGCal(item)}
                      title={`Click to open "${item.title}" directly in Google Calendar`}
                      className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between ${item.color}`}
                    >
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1" />
                    </div>
                  ))}
                  {items.length > 2 && (
                    <span className="text-[9px] text-muted-foreground font-semibold block">
                      +{items.length - 2} more
                    </span>
                  )}
                </div>

                <div className="pt-1 border-t border-border/40 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const dayStr = `2026-10-${String(d).padStart(2, '0')}`;
                      handleSyncItemToGCal({
                        title: `LifeOS Event (Day ${d})`,
                        rawDate: dayStr,
                        description: 'LifeOS Schedule Event'
                      });
                    }}
                    className="text-[9px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>+ GCal</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Calendar Permission Authorization Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border-2 border-primary/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Google Calendar Authorization</h3>
                <p className="text-xs text-muted-foreground">Grant permission to synchronize LifeOS with Google Calendar</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground bg-secondary/50 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>What Google Calendar Permission Enables:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Instant 1-click event export to Google Calendar on phone & desktop</li>
                <li>Synchronization of deadlines, exams, and shared trips</li>
                <li>Direct integration with Google Calendar mobile notifications</li>
                <li>Zero data selling — privacy-first architecture</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectGCal}
                className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                Authorize & Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
