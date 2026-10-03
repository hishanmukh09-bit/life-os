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
  UserCheck
} from 'lucide-react';

const ACCENT_COLORS = [
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
    setActiveView 
  } = useLifeOS();
  
  const [copied, setCopied] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentSpace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand & Space Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-foreground text-lg">LIFE OS</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                Two-Person Private
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              &ldquo;Build better days together.&rdquo;
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

        </div>

      </div>
    </header>
  );
}
