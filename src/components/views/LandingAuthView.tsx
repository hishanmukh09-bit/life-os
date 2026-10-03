'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Sun,
  GraduationCap,
  Dumbbell,
  CheckCircle2,
  Lock,
  Users,
  Compass,
  Zap
} from 'lucide-react';

export function LandingAuthView({ onEnterApp }: { onEnterApp: () => void }) {
  const { currentSpace, joinSpace, createSpace } = useLifeOS();

  const [authMode, setAuthMode] = useState<'LANDING' | 'LOGIN' | 'REGISTER' | 'JOIN_SPACE'>('LANDING');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [spaceCodeInput, setSpaceCodeInput] = useState('');
  const [spaceNameInput, setSpaceNameInput] = useState('Our Sanctuary');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceCodeInput.trim()) return;

    const res = joinSpace(spaceCodeInput.trim());
    if (res.success) {
      onEnterApp();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCreateSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceNameInput.trim()) return;
    createSpace(spaceNameInput.trim());
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      
      {/* Top Navbar */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-foreground">LIFE OS</span>
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                Two-Person Private
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAuthMode('LOGIN');
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:opacity-95 transition-all"
            >
              Enter Sanctuary Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {authMode === 'LANDING' && (
        <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>A private life-management space for exactly two people</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none">
            BUILD BETTER DAYS <br />
            <span className="text-primary">TOGETHER.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A private digital life-management platform for exactly two people. Plan, track, study, move, reflect, and support each other without surveillance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setAuthMode('REGISTER')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Your Private Space</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setAuthMode('JOIN_SPACE')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4 text-primary" />
              <span>Join with Invite Code</span>
            </button>
          </div>

          {/* Core Feature Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-16 text-left">
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-primary">PLAN</span>
              <p className="text-xs text-muted-foreground">My Day routines & task priorities.</p>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-sky-500">TRACK</span>
              <p className="text-xs text-muted-foreground">Hydration, sleep quality & reflection.</p>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-indigo-500">STUDY</span>
              <p className="text-xs text-muted-foreground">Focus timer & topic mastery radar.</p>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-emerald-500">MOVE</span>
              <p className="text-xs text-muted-foreground">Strength & mobility tracking.</p>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-purple-500">REFLECT</span>
              <p className="text-xs text-muted-foreground">Private journal & sacred memories.</p>
            </div>
            <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
              <span className="text-xs font-bold text-rose-500">GROW</span>
              <p className="text-xs text-muted-foreground">US Goals & mutual encouragement.</p>
            </div>
          </div>

        </main>
      )}

      {/* Auth Modal Forms */}
      {authMode !== 'LANDING' && (
        <div className="max-w-md w-full mx-auto px-6 py-12">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-xl space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <h2 className="text-base font-bold text-foreground">
                {authMode === 'LOGIN' && 'Sign In to Your Space'}
                {authMode === 'REGISTER' && 'Create Your Two-Person Space'}
                {authMode === 'JOIN_SPACE' && 'Enter Partner Invitation Code'}
              </h2>
              <button
                onClick={() => {
                  setAuthMode('LANDING');
                  setErrorMsg(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {authMode === 'JOIN_SPACE' && (
              <form onSubmit={handleJoinSpace} className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Enter the 6-character code generated by your partner (e.g. <span className="font-mono font-bold text-primary">GROW02</span>).
                </p>
                <div>
                  <label className="font-semibold text-foreground">Invite Code</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="e.g. GROW02"
                    value={spaceCodeInput}
                    onChange={(e) => setSpaceCodeInput(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-base font-mono uppercase tracking-widest text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Join Private Space
                </button>
              </form>
            )}

            {authMode === 'REGISTER' && (
              <form onSubmit={handleCreateSpaceSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Space Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Sanctuary"
                    value={spaceNameInput}
                    onChange={(e) => setSpaceNameInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Create & Generate Invite Code
                </button>
              </form>
            )}

            {authMode === 'LOGIN' && (
              <form onSubmit={(e) => { e.preventDefault(); onEnterApp(); }} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@lifeos.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Sign In
                </button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-border/50">
              <button
                type="button"
                onClick={onEnterApp}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Or enter with pre-loaded demo profiles &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>&copy; 2026 LIFE OS &bull; &ldquo;Build better days together.&rdquo; &bull; Strictly 2-Person Boundary Enforced</p>
      </footer>

    </div>
  );
}
