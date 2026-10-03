'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { SkillItem, ReadingBook, PersonalChallenge } from '@/types';
import {
  Sparkles,
  BookOpen,
  Award,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  Bookmark
} from 'lucide-react';

export function GrowthReadingView() {
  const {
    currentUser,
    skills,
    logSkillPractice,
    readingBooks,
    updateReadingProgress,
    challenges,
    advanceChallengeDay
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'SKILLS' | 'READING' | 'CHALLENGES'>('READING');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Personal Development & Reading</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deliberate skill mastery, reading progress tracking, and personal consistency challenges.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center rounded-2xl bg-muted/50 p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('READING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'READING' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Reading Tracker ({readingBooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SKILLS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'SKILLS' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span>Skills & Mastery ({skills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CHALLENGES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'CHALLENGES' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Award className="h-4 w-4 text-amber-500" />
          <span>Personal Challenges ({challenges.length})</span>
        </button>
      </div>

      {/* 1. READING TRACKER */}
      {activeTab === 'READING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {readingBooks.map((book) => {
            const pct = Math.round((book.pagesRead / (book.totalPages || 1)) * 100);
            return (
              <div key={book.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                      {book.status}
                    </span>
                    <h3 className="text-base font-bold text-foreground pt-1">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">by {book.author}</p>
                  </div>
                  <span className="text-sm font-extrabold text-primary">{pct}%</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{book.pagesRead} pages read</span>
                    <span>{book.totalPages} total pages</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {book.notes && (
                  <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                    &ldquo;{book.notes}&rdquo;
                  </p>
                )}

                {/* Quick page increment */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => updateReadingProgress(book.id, book.pagesRead + 10)}
                    className="px-3 py-1 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground"
                  >
                    +10 Pages
                  </button>
                  <button
                    onClick={() => updateReadingProgress(book.id, book.pagesRead + 25)}
                    className="px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                  >
                    +25 Pages
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. SKILLS */}
      {activeTab === 'SKILLS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((skill) => (
            <div key={skill.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                    {skill.category}
                  </span>
                  <h3 className="text-base font-bold text-foreground pt-1">{skill.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-foreground">{skill.practiceHours}h</span>
                  <span className="text-[10px] text-muted-foreground block">Practiced</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                <span>Current: <strong className="text-foreground">{skill.currentLevel}</strong></span>
                <span>Target: <strong className="text-primary">{skill.targetLevel}</strong></span>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Key Resources</span>
                <ul className="mt-1 space-y-1 text-xs text-foreground">
                  {skill.resources.map((res, i) => (
                    <li key={i} className="truncate">&bull; {res}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => logSkillPractice(skill.id, 1)}
                className="w-full mt-2 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground"
              >
                + Log 1 Hour Deliberate Practice
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. CHALLENGES */}
      {activeTab === 'CHALLENGES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {challenges.map((ch) => {
            const pct = Math.round((ch.currentDay / ch.targetDays) * 100);
            return (
              <div key={ch.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                      {ch.category} Challenge
                    </span>
                    <h3 className="text-base font-bold text-foreground pt-1">{ch.title}</h3>
                  </div>
                  <span className="text-sm font-extrabold text-amber-500">{pct}%</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Day {ch.currentDay} of {ch.targetDays}</span>
                    <span>{ch.targetDays - ch.currentDay} days left</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => advanceChallengeDay(ch.id)}
                  className="w-full py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:opacity-90"
                >
                  Mark Today Completed (Day {ch.currentDay})
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
