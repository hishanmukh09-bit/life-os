'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { 
  Heart, 
  Sparkles, 
  Moon, 
  Sun, 
  Laptop, 
  Copy, 
  Check, 
  Users, 
  ShieldCheck,
  Plus,
  Zap,
  Activity,
  UserCheck,
  Bell,
  Menu,
  X,
  CheckSquare,
  Dumbbell,
  Utensils,
  GraduationCap,
  Flame,
  Target,
  Camera,
  CalendarDays,
  Settings as SettingsIcon,
  FolderLock,
  Bot,
  Volume2,
  VolumeX,
  Download
} from 'lucide-react';
import { soundFx } from '@/lib/sound-fx';

const ACCENT_COLORS = [
  { name: 'Rose Gold', id: 'rose-gold', class: 'bg-rose-400' },
  { name: 'OLED Midnight', id: 'midnight', class: 'bg-zinc-800' },
  { name: 'Indigo', id: 'indigo', class: 'bg-indigo-500' },
  { name: 'Rose', id: 'rose', class: 'bg-rose-500' },
  { name: 'Emerald', id: 'emerald', class: 'bg-emerald-500' },
  { name: 'Amber', id: 'amber', class: 'bg-amber-500' },
  { name: 'Ocean', id: 'ocean', class: 'bg-sky-500' },
  { name: 'Violet', id: 'violet', class: 'bg-purple-500' },
];

export function Navbar() {
  const { 
    currentUser, 
    currentSpace, 
    partnerUser, 
    switchUser, 
    setAccentColor, 
    setTheme,
    setActiveView,
    cloudSyncStatus,
    requestNotificationPermission
  } = useLifeOS();
  
  const [copied, setCopied] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  React.useEffect(() => {
    setIsSoundMuted(soundFx.isMuted());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      try {
        new Notification('🔔 Real-Time Notifications Enabled!', {
          body: 'LifeOS will alert you across devices when tasks are due or synchronized.',
          icon: '/favicon.ico'
        });
      } catch {}
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      loadNotifications();
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const copyInviteCode = () => {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand & Space Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-lg">LIFE OS</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                Private Space
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Personal & Shared Life Operating System
            </p>
          </div>
        </div>

        {/* Right Actions: Space Code, Partner Status, Switcher, Theme & Accents */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Space Code Pill */}
          <button
            onClick={copyInviteCode}
            title="Click to copy 6-character partner invite code"
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground hidden md:inline">Space:</span>
            <span className="font-mono font-bold tracking-wider">{currentSpace.inviteCode}</span>
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </button>

          {/* Live Multi-Device Cloud Sync Status Pill */}
          <div
            title={
              cloudSyncStatus === 'connected'
                ? 'Live Cloud Sync Connected: Changes synchronize simultaneously across your phone, laptop, and all devices.'
                : cloudSyncStatus === 'connecting'
                ? 'Connecting to real-time sync channel...'
                : 'Reconnecting to cloud sync...'
            }
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                cloudSyncStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : cloudSyncStatus === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline text-muted-foreground">Sync:</span>
            <span className="font-semibold text-[11px] text-foreground">
              {cloudSyncStatus === 'connected' ? 'Live' : cloudSyncStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </div>

          {/* Real Web Notification Permission Button */}
          <button
            onClick={handleRequestNotifications}
            title={
              notifPermission === 'granted'
                ? 'Real-Time Notifications Active: You will receive native alerts on phone & laptop.'
                : 'Click to enable real-time device notifications for due tasks and reminders'
            }
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
              notifPermission === 'granted'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 animate-pulse'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-semibold">
              {notifPermission === 'granted' ? 'Alerts On' : 'Enable Alerts'}
            </span>
          </button>

          {/* Quick Partner Awareness Pill */}
          {partnerUser && (
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/40 bg-card/60 px-3 py-1 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">Partner:</span>
              <span className="font-semibold text-foreground">{partnerUser.name.split(' ')[0]}</span>
            </div>
          )}

          {/* User Switcher (Shanmukh / Satvika Demo Switcher) */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              onClick={() => switchUser('user_shanmukh')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentUser.id === 'user_shanmukh'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-3 w-3" />
              <span>Shanmukh</span>
            </button>
            <button
              onClick={() => switchUser('user_satvika')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                currentUser.id === 'user_satvika'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-3 w-3" />
              <span>Satvika</span>
            </button>
          </div>

          {/* Quick Install LifeOS App Button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('lifeos:open-install-guide'));
              }
            }}
            title="Install LifeOS Native App on Phone/PC"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary transition-colors active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>

          {/* Accent Color Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPalette(!showPalette)}
              title="Change Accent Color"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </button>
            {showPalette && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-card p-2 shadow-lg z-50 flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1">Accent Color</span>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setAccentColor(c.id);
                        setShowPalette(false);
                      }}
                      className={`h-7 rounded-md ${c.class} flex items-center justify-center text-white transition-transform hover:scale-105 ${
                        currentUser.accentColor === c.id ? 'ring-2 ring-foreground' : ''
                      }`}
                      title={c.name}
                    >
                      {currentUser.accentColor === c.id && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notification Center Popover (Requirement 22) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
              title="Notification Center"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {notificationsList.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">No notifications yet.</p>
                  ) : (
                    notificationsList.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-0.5 transition-colors ${
                          notif.is_read ? 'border-border/40 bg-secondary/20 opacity-70' : 'border-primary/30 bg-primary/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate">{notif.title}</span>
                          {!notif.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{notif.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light / System Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              onClick={() => setTheme('light')}
              title="Light Mode"
              className={`h-7 w-7 flex items-center justify-center rounded-md ${
                currentUser.theme === 'light' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Dark Mode"
              className={`h-7 w-7 flex items-center justify-center rounded-md ${
                currentUser.theme === 'dark' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sound FX Synthesizer Toggle */}
          <button
            onClick={() => {
              const newState = soundFx.toggleMute();
              setIsSoundMuted(newState);
              if (!newState) {
                soundFx.playEncouragementChime();
              }
            }}
            title={isSoundMuted ? 'Sound FX: Muted (Click to Unmute)' : 'Sound FX: Active (Click to Mute)'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
          >
            {isSoundMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground/50" />
            ) : (
              <Volume2 className="h-4 w-4 text-primary animate-pulse" />
            )}
          </button>

          {/* Mobile All-Sections Drawer Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50 text-foreground transition-colors"
            title="All Sections Menu"
            aria-label="Toggle All Sections Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

        </div>

      </div>

      {/* Mobile All-Sections Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border overflow-y-auto p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All LIFE OS Sections</span>
            <span className="text-[11px] font-semibold text-primary">{currentUser.name}&apos;s Workspace</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'HOME', label: 'Home Dashboard', icon: Activity },
              { id: 'TASKS', label: 'Tasks & Proof', icon: CheckSquare },
              { id: 'STUDY', label: 'Study & Exams', icon: GraduationCap },
              { id: 'WORKOUT', label: 'Workouts', icon: Dumbbell },
              { id: 'FOOD', label: 'Food & Meals', icon: Utensils },
              { id: 'TRACK', label: 'Track & Wellness', icon: Activity },
              { id: 'HABITS', label: 'Habits Tracker', icon: Flame },
              { id: 'GOALS', label: 'Goals (Me & Us)', icon: Target },
              { id: 'GALLERY', label: 'Photo Gallery', icon: Camera },
              { id: 'CALENDAR', label: 'Shared Calendar', icon: CalendarDays },
              { id: 'LIFE_ADMIN', label: 'Life Admin', icon: FolderLock },
              { id: 'AI_COACH', label: 'AI Life Coach', icon: Bot },
              { id: 'SETTINGS', label: 'Settings & Privacy', icon: SettingsIcon },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/60 bg-card hover:bg-primary/10 hover:border-primary/40 text-left transition-all font-semibold text-foreground active:scale-95"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Install LifeOS Action in Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('lifeos:open-install-guide'));
              }
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md active:scale-95 transition-transform"
          >
            <Download className="h-4 w-4" />
            <span>Install LifeOS App on Home Screen</span>
          </button>

          {/* Quick Space & Partner Info */}
          <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>Space Code: {currentSpace.inviteCode}</span>
              <span className="text-emerald-500">Private 2-Person</span>
            </div>
            <p>Sharing space with {partnerUser ? partnerUser.name : 'Partner'}. All activities isolated.</p>
          </div>
        </div>
      )}
    </header>
  );
}
