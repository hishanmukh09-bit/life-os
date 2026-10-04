'use client';

import React from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Home,
  Clock,
  Sun,
  CheckSquare,
  FolderKanban,
  Calendar,
  Activity,
  Dumbbell,
  Utensils,
  GraduationCap,
  Flame,
  Target,
  LineChart,
  CalendarDays,
  Camera,
  Award,
  CreditCard,
  Users,
  BookOpen,
  FolderLock,
  Bot,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const { activeView, setActiveView, tasks, encouragements, partnerUser, sharedExpenses } = useLifeOS();

  const unreadEncouragements = encouragements.filter(e => !e.read).length;
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED').length;
  const pendingExpenses = sharedExpenses.filter(e => !e.isSettled).length;

  const NAV_ITEMS: NavItem[] = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'TASKS', label: 'Tasks & Proof', icon: CheckSquare, badge: pendingTasks },
    { id: 'STUDY', label: 'Study & Exams', icon: GraduationCap },
    { id: 'HABITS', label: 'Habits', icon: Flame },
    { id: 'GOALS', label: 'Goals (Me & Us)', icon: Target },
    { id: 'CALENDAR', label: 'Shared Calendar', icon: CalendarDays },
    { id: 'GALLERY', label: 'Our Photo Gallery', icon: Camera },
    { id: 'FINANCE', label: 'Finance & Trips', icon: CreditCard, badge: pendingExpenses || undefined },
    { id: 'US', label: 'Our Shared Space', icon: Users, badge: unreadEncouragements || undefined },
    { id: 'JOURNAL', label: 'Private Journal', icon: BookOpen },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/40 shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Partner privacy footer */}
      <div className="mt-auto p-4 m-3 rounded-2xl border border-border/50 bg-secondary/30 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-foreground">Encrypted Workspace</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          {partnerUser ? `Sharing space with ${partnerUser.name.split(' ')[0]}. Strict privacy isolated.` : 'Private space active.'}
        </p>
      </div>
    </aside>
  );
}
