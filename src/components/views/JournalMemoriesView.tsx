'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { JournalEntry, MemoryItem, LittleThing, Visibility } from '@/types';
import {
  BookOpen,
  Camera,
  Heart,
  Plus,
  Shield,
  Sparkles,
  Calendar,
  Gift,
  Coffee,
  Bookmark,
  Share2
} from 'lucide-react';

export function JournalMemoriesView() {
  const {
    currentUser,
    partnerUser,
    memories,
    littleThings,
    addMemory,
    addLittleThing
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'JOURNAL' | 'MEMORIES' | 'LITTLE_THINGS'>('MEMORIES');

  // Journal entries state (Private by default)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      id: 'j1',
      spaceId: 'space_lifeos_demo',
      userId: currentUser.id,
      date: new Date().toISOString().split('T')[0],
      title: 'Euler-Lagrange clarity & morning training',
      content: 'Felt a deep state of uninterrupted focus today during mathematical derivations. Remembering to drink water consistently helped eliminate my typical 3 PM cognitive fog.',
      mood: 'Focused',
      gratitude: ['Quiet early morning sunlight', 'Fresh ground pour-over coffee', 'Partner checking in with encouragement'],
      photos: [],
      visibility: 'PRIVATE'
    }
  ]);

  // Form states
  const [jTitle, setJTitle] = useState('');
  const [jContent, setJContent] = useState('');
  const [jGratitude, setJGratitude] = useState('');
  const [jVisibility, setJVisibility] = useState<Visibility>('PRIVATE');

  const [mTitle, setMTitle] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [mCategory, setMCategory] = useState<MemoryItem['category']>('Trip');
  const [mPhoto, setMPhoto] = useState('');

  const [ltTitle, setLtTitle] = useState('');
  const [ltDetails, setLtDetails] = useState('');
  const [ltCategory, setLtCategory] = useState<LittleThing['category']>('Favorite Food');

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle.trim()) return;

    setJournalEntries(prev => [
      {
        id: 'j_' + Date.now(),
        spaceId: 'space_lifeos_demo',
        userId: currentUser.id,
        date: new Date().toISOString().split('T')[0],
        title: jTitle.trim(),
        content: jContent.trim(),
        mood: 'Grateful',
        gratitude: jGratitude.split(',').map(g => g.trim()),
        photos: [],
        visibility: jVisibility
      },
      ...prev
    ]);

    setJTitle('');
    setJContent('');
    setJGratitude('');
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    addMemory({
      title: mTitle.trim(),
      notes: mNotes.trim(),
      date: new Date().toISOString().split('T')[0],
      category: mCategory,
      photoUrl: mPhoto.trim() || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
    });

    setMTitle('');
    setMNotes('');
    setMPhoto('');
  };

  const handleAddLittleThing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ltTitle.trim()) return;

    addLittleThing({
      forPartner: true,
      category: ltCategory,
      title: ltTitle.trim(),
      details: ltDetails.trim() || undefined
    });

    setLtTitle('');
    setLtDetails('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Memories, Journal & Little Things</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Capture sacred shared milestones, quiet personal reflections, and thoughtful partner details.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center rounded-2xl bg-muted/50 p-1 text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('MEMORIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'MEMORIES' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Camera className="h-4 w-4 text-primary" />
          <span>Our Memories ({memories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('JOURNAL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'JOURNAL' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4 text-indigo-500" />
          <span>Private Journal</span>
        </button>

        <button
          onClick={() => setActiveTab('LITTLE_THINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'LITTLE_THINGS' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
          }`}
        >
          <Gift className="h-4 w-4 text-rose-500" />
          <span>Little Things</span>
        </button>
      </div>

      {/* 1. OUR MEMORIES TAB */}
      {activeTab === 'MEMORIES' && (
        <div className="space-y-6">
          {/* Add Memory Form */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Save New Deliberate Memory
            </h3>
            <form onSubmit={handleAddMemory} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Memory Title (e.g. Sunset hike, First apartment keys)"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as MemoryItem['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="Trip">Trip</option>
                  <option value="Achievement">Achievement</option>
                  <option value="Milestone">Milestone</option>
                  <option value="Special Day">Special Day</option>
                  <option value="Shared Activity">Shared Activity</option>
                  <option value="Fun">Fun</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="The story, feelings, or funny moments..."
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Add to Our Memories
                </button>
              </div>
            </form>
          </div>

          {/* Memories Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.map((mem) => (
              <div key={mem.id} className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs space-y-3">
                {mem.photoUrl && (
                  <img
                    src={mem.photoUrl}
                    alt={mem.title}
                    className="w-full h-52 object-cover"
                  />
                )}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase">
                      {mem.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {mem.date}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{mem.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mem.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PRIVATE JOURNAL TAB */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h3 className="text-base font-bold text-foreground">Write Reflection Entry</h3>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" /> Default strictly private
              </span>
            </div>

            <form onSubmit={handleAddJournal} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Entry Title..."
                value={jTitle}
                onChange={(e) => setJTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground font-semibold"
              />

              <textarea
                rows={3}
                placeholder="What is on your mind? What lessons did today offer?"
                value={jContent}
                onChange={(e) => setJContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />

              <input
                type="text"
                placeholder="Gratitude items (comma separated, e.g. morning tea, completed assignment)"
                value={jGratitude}
                onChange={(e) => setJGratitude(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Visibility:</span>
                  <select
                    value={jVisibility}
                    onChange={(e) => setJVisibility(e.target.value as Visibility)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                  >
                    <option value="PRIVATE">Strictly Private (Me Only)</option>
                    <option value="SHARED">Share with Partner</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Save Journal Entry
                </button>
              </div>
            </form>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-4">
            {journalEntries.map((j) => (
              <div key={j.id} className="p-6 rounded-3xl border border-border bg-card shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {j.date}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {j.visibility === 'PRIVATE' ? 'Private Lock' : 'Shared with Partner'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-foreground">{j.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{j.content}</p>

                {j.gratitude.length > 0 && (
                  <div className="pt-2 border-t border-border/50 text-xs">
                    <span className="font-bold text-foreground">Gratitudes: </span>
                    <span className="text-muted-foreground">{j.gratitude.join(' &bull; ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LITTLE THINGS TAB */}
      {activeTab === 'LITTLE_THINGS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-border bg-card shadow-xs space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-500" />
              Save a Thoughtful Partner Detail
            </h3>
            <p className="text-xs text-muted-foreground">
              Manually save things your partner mentioned, favorite foods, gift ideas, or future surprises.
            </p>

            <form onSubmit={handleAddLittleThing} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <select
                  value={ltCategory}
                  onChange={(e) => setLtCategory(e.target.value as LittleThing['category'])}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="Favorite Food">Favorite Food</option>
                  <option value="Gift Idea">Gift Idea</option>
                  <option value="Partner Mentioned">Partner Mentioned</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Future Plan">Future Plan</option>
                  <option value="Surprise Idea">Surprise Idea</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Detail / Item (e.g. Sage green headphones)"
                  value={ltTitle}
                  onChange={(e) => setLtTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Save Little Thing
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {littleThings.map((lt) => (
              <div key={lt.id} className="p-5 rounded-3xl border border-border bg-card shadow-2xs space-y-2 text-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase">
                  {lt.category}
                </span>
                <h4 className="text-sm font-bold text-foreground pt-1">{lt.title}</h4>
                {lt.details && <p className="text-muted-foreground">{lt.details}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
