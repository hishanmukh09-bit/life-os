'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Sun,
  CloudSun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  Coffee,
  BookOpen,
  Dumbbell,
  Droplets
} from 'lucide-react';

interface RoutineBlock {
  id: string;
  timeRange: string;
  title: string;
  icon: React.ElementType;
  items: { id: string; title: string; category: string; done: boolean }[];
}

export function MyDayView() {
  const { currentUser, tasks, waterIntake, toggleTask } = useLifeOS();

  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>([
    {
      id: 'morning',
      timeRange: '06:30 AM – 11:30 AM',
      title: 'Morning Routine & Activation',
      icon: Sun,
      items: [
        { id: 'm1', title: 'Wake up at target 06:45 AM (gentle natural light)', category: 'Sleep', done: true },
        { id: 'm2', title: 'Hydrate: Drink 500ml water with electrolytes', category: 'Health', done: true },
        { id: 'm3', title: 'Morning 45-min Strength Workout', category: 'Fitness', done: true },
        { id: 'm4', title: 'High-protein breakfast & daily planning check-in', category: 'Nutrition', done: true },
        { id: 'm5', title: 'Deep Focus Block 1 (Theoretical Engineering Proofs)', category: 'Study', done: false },
      ]
    },
    {
      id: 'afternoon',
      timeRange: '11:30 AM – 04:30 PM',
      title: 'Afternoon Execution & Classes',
      icon: CloudSun,
      items: [
        { id: 'a1', title: 'Robotics Seminar & Lab Simulation', category: 'College', done: true },
        { id: 'a2', title: 'Nourishing Lunch & 15-min walk outside', category: 'Nutrition', done: true },
        { id: 'a3', title: 'Second hydration wave (Reach 1.8L)', category: 'Health', done: waterIntake >= 1800 },
        { id: 'a4', title: 'Deep Focus Block 2 (Simulation & Code)', category: 'Study', done: false },
        { id: 'a5', title: 'Clear high-priority administrative emails', category: 'Life Admin', done: false },
      ]
    },
    {
      id: 'evening',
      timeRange: '04:30 PM – 08:30 PM',
      title: 'Evening Synthesis & Reconnect',
      icon: Sunset,
      items: [
        { id: 'e1', title: 'Joint mobility & outdoor walk with partner', category: 'Relationship', done: false },
        { id: 'e2', title: 'Problem set revision for upcoming exam', category: 'Study', done: false },
        { id: 'e3', title: 'Cook dinner together & decompress', category: 'Nutrition', done: false },
      ]
    },
    {
      id: 'night',
      timeRange: '08:30 PM – 10:45 PM',
      title: 'Night Wind-Down & Prepare Tomorrow',
      icon: Moon,
      items: [
        { id: 'n1', title: 'Run "Prepare Tomorrow" AI review', category: 'Planning', done: false },
        { id: 'n2', title: 'Private Journal reflection & gratitude logging', category: 'Reflection', done: false },
        { id: 'n3', title: 'Screens off 45 mins before bedtime target (11:00 PM)', category: 'Sleep', done: false },
      ]
    }
  ]);

  const toggleRoutineItem = (blockId: string, itemId: string) => {
    setRoutineBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          items: b.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
        };
      }
      return b;
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Day Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured daily rhythms tailored to your energy flow and biological clock.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Target Wake: {currentUser.wakeTargetTime}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
            Target Sleep: {currentUser.sleepTargetHours}h
          </span>
        </div>
      </div>

      {/* Routine Blocks Timeline */}
      <div className="space-y-6">
        {routineBlocks.map((block) => {
          const Icon = block.icon;
          const completedCount = block.items.filter(it => it.done).length;
          const pct = Math.round((completedCount / (block.items.length || 1)) * 100);

          return (
            <div key={block.id} className="rounded-3xl border border-border bg-card p-6 shadow-2xs space-y-4">
              
              {/* Block Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{block.title}</h2>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {block.timeRange}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-primary">{pct}% Complete</span>
                  <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                {block.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleRoutineItem(block.id, item.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      item.done
                        ? 'border-border/40 bg-secondary/20 text-muted-foreground line-through'
                        : 'border-border/70 bg-card hover:border-primary/40 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">{item.title}</span>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
