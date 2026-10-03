'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import {
  Camera,
  Calendar,
  Filter,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';

interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  category: 'Memories' | 'Workouts' | 'Food' | 'Check-in' | 'Trips';
  date: string;
}

export function PhotoGalleryView() {
  const { memories, workouts, meals, checkins, openLightbox } = useLifeOS();
  const [filter, setFilter] = useState<string>('ALL');

  // Aggregate all photos with safety check
  const allPhotos: GalleryPhoto[] = [
    ...memories.filter(m => m.photoUrl).map(m => ({
      id: m.id,
      url: m.photoUrl!,
      title: m.title,
      category: 'Memories' as const,
      date: m.date
    })),
    ...workouts.filter(w => w.photoUrl && w.visibility === 'SHARED').map(w => ({
      id: w.id,
      url: w.photoUrl!,
      title: `${w.type} Workout`,
      category: 'Workouts' as const,
      date: w.date
    })),
    ...meals.filter(m => m.photoUrl && m.visibility === 'SHARED').map(m => ({
      id: m.id,
      url: m.photoUrl!,
      title: `${m.mealType}: ${m.food}`,
      category: 'Food' as const,
      date: m.date
    })),
    ...checkins.filter(c => c.photoUrl && c.visibility === 'SHARED').map(c => ({
      id: c.id,
      url: c.photoUrl!,
      title: `Morning Check-in (${c.mood})`,
      category: 'Check-in' as const,
      date: c.date
    }))
  ];

  const filteredPhotos = filter === 'ALL' ? allPhotos : allPhotos.filter(p => p.category === filter);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Our Photo Gallery</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Photo-first visual sanctuary. Only explicitly shared memories, workouts, meals & moments.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1 text-xs font-semibold">
          {['ALL', 'Memories', 'Workouts', 'Food', 'Check-in'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === cat ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Photos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => openLightbox({ url: photo.url, title: photo.title, timestamp: photo.date })}
            className="group relative h-48 sm:h-56 rounded-3xl overflow-hidden border border-border bg-card shadow-2xs cursor-pointer"
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity p-3 flex flex-col justify-end text-white">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs w-fit uppercase">
                {photo.category}
              </span>
              <h4 className="text-xs font-bold pt-1 truncate">{photo.title}</h4>
              <span className="text-[10px] text-white/70 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {photo.date}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
