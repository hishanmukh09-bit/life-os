'use client';

import React from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Sun,
  Droplets,
  Dumbbell,
  Utensils,
  GraduationCap,
  BookOpen,
  Moon,
  Clock,
  Camera,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface TimelineEvent {
  time: string;
  title: string;
  category: 'WAKE' | 'WATER' | 'WORKOUT' | 'MEAL' | 'COLLEGE' | 'STUDY' | 'TASK' | 'REFLECTION' | 'SLEEP';
  details: string;
  icon: React.ElementType;
  photoUrl?: string;
  isCompleted: boolean;
}

export function DailyTimelineView() {
  const { currentUser, waterIntake, openLightbox } = useLifeOS();

  const TIMELINE_EVENTS: TimelineEvent[] = [
    {
      time: '06:45 AM',
      title: 'Wake Up & Natural Sunlight',
      category: 'WAKE',
      details: `Target: ${currentUser.wakeTargetTime}. Gentle morning natural illumination.`,
      icon: Sun,
      photoUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500&auto=format&fit=crop&q=80',
      isCompleted: true
    },
    {
      time: '07:00 AM',
      title: 'Morning Hydration Activation',
      category: 'WATER',
      details: '500 ml room temperature water with lemon & sea salt.',
      icon: Droplets,
      isCompleted: true
    },
    {
      time: '07:30 AM',
      title: 'Upper Body Hypertrophy Session',
      category: 'WORKOUT',
      details: '45 mins dumbbell press, bent-over rows & shoulder press.',
      icon: Dumbbell,
      photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80',
      isCompleted: true
    },
    {
      time: '08:30 AM',
      title: 'Nourishing Breakfast',
      category: 'MEAL',
      details: '3 scrambled eggs with avocado and whole wheat sourdough toast (~580 kcal).',
      icon: Utensils,
      photoUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
      isCompleted: true
    },
    {
      time: '09:00 AM',
      title: 'Robotics Dynamics & Kinematics Lecture',
      category: 'COLLEGE',
      details: 'Hall 402 with Dr. Vance. Topic: Euler-Lagrange formulations for spatial arms.',
      icon: GraduationCap,
      isCompleted: true
    },
    {
      time: '11:30 AM',
      title: 'Deep Focus Study Block 1',
      category: 'STUDY',
      details: '50-minute Pomodoro session in Graduate Library. Re-deriving Coriolis matrices.',
      icon: BookOpen,
      isCompleted: true
    },
    {
      time: '01:15 PM',
      title: 'Mindful Lunch & Partner Catch-Up',
      category: 'MEAL',
      details: 'Mediterranean quinoa bowl with roasted chickpeas & tahini dressing.',
      icon: Utensils,
      isCompleted: true
    },
    {
      time: '03:30 PM',
      title: 'Hydration Checkpoint',
      category: 'WATER',
      details: `Current: ${(waterIntake / 1000).toFixed(2)}L / ${(currentUser.waterTargetMl / 1000).toFixed(1)}L target.`,
      icon: Droplets,
      isCompleted: waterIntake >= 1750
    },
    {
      time: '05:00 PM',
      title: 'Robotics Assignment Problem Set #4',
      category: 'TASK',
      details: 'Derive inertia matrix and Coriolis vectors. Photo proof submitted.',
      icon: CheckCircle2,
      photoUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80',
      isCompleted: true
    },
    {
      time: '07:30 PM',
      title: 'Cook Dinner Together & Reconnect',
      category: 'MEAL',
      details: 'Cooking vegetarian stir-fry with partner. Evening decompression.',
      icon: Utensils,
      isCompleted: false
    },
    {
      time: '09:00 PM',
      title: 'Evening Reflection & Gratitude',
      category: 'REFLECTION',
      details: 'Log 3 highlights in Private Journal. Run "Prepare Tomorrow" AI plan.',
      icon: Sparkles,
      isCompleted: false
    },
    {
      time: '10:45 PM',
      title: 'Restorative Sleep Target',
      category: 'SLEEP',
      details: `Target: ${currentUser.sleepTargetHours} hours of cellular recovery. Screens off by 10:15 PM.`,
      icon: Moon,
      isCompleted: false
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Daily Life Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scrollable, photo-first visual chronicle of your entire day from wake-up to sleep.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {TIMELINE_EVENTS.filter(e => e.isCompleted).length} / {TIMELINE_EVENTS.length} Checkpoints Done
          </span>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/20 space-y-6 ml-4">
        {TIMELINE_EVENTS.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={idx} className="relative group">
              
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all ${
                  event.isCompleted
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'border-muted-foreground/40 bg-card text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>

              {/* Event Card */}
              <div className="p-4 sm:p-5 rounded-3xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {event.time}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                      {event.category}
                    </span>
                    {event.isCompleted && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-sm">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{event.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{event.details}</p>
                </div>

                {/* Optional Photo Thumbnail */}
                {event.photoUrl && (
                  <div
                    onClick={() => openLightbox({ url: event.photoUrl!, title: event.title, timestamp: event.time })}
                    className="relative cursor-pointer group/img shrink-0"
                  >
                    <img
                      src={event.photoUrl}
                      alt={event.title}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-border group-hover/img:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                      <Camera className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
