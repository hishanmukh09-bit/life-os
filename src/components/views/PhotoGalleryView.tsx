'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/store';
import { PhotoPicker } from '@/components/ui/PhotoPicker';
import {
  Camera,
  Calendar,
  Filter,
  ShieldCheck,
  Eye,
  Sparkles,
  Lock,
  Globe,
  Plus,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface GalleryPhoto {
  id: string;
  url: string;
  title: string;
  category: 'Memories' | 'Workouts' | 'Food' | 'Tasks' | 'Study' | 'Trips' | 'Private';
  date: string;
  visibility: 'PRIVATE' | 'SHARED';
  ownerName: string;
}

export function PhotoGalleryView() {
  const { currentUser, partnerUser, memories, workouts, meals, checkins, tasks, studySessions, trips, openLightbox, addMemory } = useLifeOS();
  const [filter, setFilter] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'Memories' | 'Trips' | 'Study'>('Memories');
  const [newPhotoVisibility, setNewPhotoVisibility] = useState<'PRIVATE' | 'SHARED'>('SHARED');

  // Server-persisted media list
  const [serverMedia, setServerMedia] = useState<any[]>([]);

  useEffect(() => {
    async function loadServerPhotos() {
      try {
        const res = await fetch(`/api/media?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setServerMedia(data.items);
          }
        }
      } catch (e) {}
    }
    loadServerPhotos();
  }, [currentUser.id]);

  // Aggregate all photos with strict privacy filtering
  const allPhotos: GalleryPhoto[] = [
    // Server uploaded media
    ...serverMedia.map(sm => ({
      id: sm.id,
      url: sm.url,
      title: sm.caption || `${sm.parent_type} Snapshot`,
      category: (sm.parent_type === 'TASK_PROOF' ? 'Tasks' : sm.parent_type === 'MEAL' ? 'Food' : sm.parent_type === 'WORKOUT' ? 'Workouts' : sm.parent_type === 'STUDY' ? 'Study' : sm.parent_type === 'TRIP' ? 'Trips' : 'Memories') as any,
      date: sm.created_at.split('T')[0],
      visibility: sm.visibility as any,
      ownerName: sm.owner_id === currentUser.id ? currentUser.name.split(' ')[0] : (partnerUser?.name.split(' ')[0] || 'Partner')
    })),
    // Memories (Shared with partner or user's own)
    ...memories.filter(m => m.photoUrl && (m.visibility === 'SHARED' || !m.visibility || m.userId === currentUser.id)).map(m => ({
      id: m.id,
      url: m.photoUrl!,
      title: m.title,
      category: m.visibility === 'PRIVATE' ? ('Private' as const) : ('Memories' as const),
      date: m.date,
      visibility: (m.visibility || 'SHARED') as any,
      ownerName: m.userId === currentUser.id ? currentUser.name.split(' ')[0] : (partnerUser?.name.split(' ')[0] || 'Partner')
    })),
    // Workouts (Shared or user's own private)
    ...workouts.filter(w => w.photoUrl && (w.visibility === 'SHARED' || w.userId === currentUser.id)).map(w => ({
      id: w.id,
      url: w.photoUrl!,
      title: `${w.type} Workout`,
      category: w.visibility === 'PRIVATE' ? ('Private' as const) : ('Workouts' as const),
      date: w.date,
      visibility: w.visibility,
      ownerName: w.userId === currentUser.id ? currentUser.name.split(' ')[0] : (partnerUser?.name.split(' ')[0] || 'Partner')
    })),
    // Meals (Shared or user's own private)
    ...meals.filter(m => m.photoUrl && (m.visibility === 'SHARED' || m.userId === currentUser.id)).map(m => ({
      id: m.id,
      url: m.photoUrl!,
      title: `${m.mealType}: ${m.food}`,
      category: m.visibility === 'PRIVATE' ? ('Private' as const) : ('Food' as const),
      date: m.date,
      visibility: m.visibility,
      ownerName: m.userId === currentUser.id ? currentUser.name.split(' ')[0] : (partnerUser?.name.split(' ')[0] || 'Partner')
    })),
    // Task Proofs
    ...tasks.filter(t => t.proof && (t.visibility === 'SHARED' || t.creatorId === currentUser.id)).map(t => ({
      id: t.proof!.id,
      url: t.proof!.imageUrl,
      title: `Proof: ${t.title}`,
      category: t.visibility === 'PRIVATE' ? ('Private' as const) : ('Tasks' as const),
      date: t.dueDate || new Date().toISOString().split('T')[0],
      visibility: t.visibility,
      ownerName: t.proof!.uploadedBy
    })),
    // Study Notes & Blackboard captures
    ...studySessions.filter(s => s.learnedPhotoUrl).map(s => ({
      id: s.id,
      url: s.learnedPhotoUrl!,
      title: `Study Session: ${s.subjectName || 'Focus Block'}`,
      category: 'Study' as const,
      date: s.date,
      visibility: 'PRIVATE' as const,
      ownerName: currentUser.name.split(' ')[0]
    }))
  ];

  // Remove duplicates based on URL
  const uniquePhotos = Array.from(new Map(allPhotos.map(p => [p.url, p])).values());

  const filteredPhotos = filter === 'ALL'
    ? uniquePhotos
    : filter === 'PRIVATE'
      ? uniquePhotos.filter(p => p.visibility === 'PRIVATE')
      : uniquePhotos.filter(p => p.category === filter);

  // Group photos by Month & Year (Requirement 12)
  const groupedPhotos: Record<string, GalleryPhoto[]> = {};
  filteredPhotos.forEach(photo => {
    const d = new Date(photo.date);
    const monthYear = isNaN(d.getTime()) ? 'Recent Moments' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedPhotos[monthYear]) groupedPhotos[monthYear] = [];
    groupedPhotos[monthYear].push(photo);
  });

  const handleSaveUploadedPhoto = () => {
    if (!newPhotoUrl) return;
    addMemory({
      title: newPhotoTitle.trim() || 'Captured Moment',
      notes: 'Saved via Real Photo Gallery',
      category: 'Special Day',
      date: new Date().toISOString().split('T')[0],
      photoUrl: newPhotoUrl,
      visibility: newPhotoVisibility
    });
    setShowUploadModal(false);
    setNewPhotoUrl('');
    setNewPhotoTitle('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Camera className="h-4 w-4" />
            <span>Real Photographic Memory Gallery</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Photos & Visual Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real photos only. Clean category sorting, date grouping, and strict two-person privacy isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Capture Photo</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs (Requirement 11 & 42) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        {['ALL', 'Memories', 'Tasks', 'Food', 'Workouts', 'Study', 'Trips', 'Private'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat} {cat === 'ALL' ? `(${uniquePhotos.length})` : ''}
          </button>
        ))}
      </div>

      {/* Grouped by Date (Requirement 12) */}
      {Object.keys(groupedPhotos).length === 0 ? (
        /* Empty State */
        <div className="text-center p-14 rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No photos in &ldquo;{filter}&rdquo; yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Photos you take from tasks, meals, workouts, or moments will appear here. No fake stock images.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95"
          >
            Take First Photo
          </button>
        </div>
      ) : (
        Object.entries(groupedPhotos).map(([monthYear, photos]) => (
          <div key={monthYear} className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">{monthYear}</h2>
              <span className="text-[11px] text-muted-foreground font-semibold">({photos.length} photos)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => openLightbox({ url: photo.url, title: photo.title, timestamp: photo.date })}
                  className="group relative h-48 sm:h-56 rounded-3xl overflow-hidden border border-border bg-card shadow-xs cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity p-3 flex flex-col justify-end text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs uppercase">
                        {photo.category}
                      </span>
                      {photo.visibility === 'PRIVATE' ? (
                        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold text-amber-300">
                          <Lock className="h-2.5 w-2.5" /> Private
                        </span>
                      ) : (
                        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold text-emerald-300">
                          <Globe className="h-2.5 w-2.5" /> Shared
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold pt-1.5 truncate">{photo.title}</h4>
                    <span className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
                      <span>{photo.ownerName}</span> &bull; <span>{photo.date}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Real Photo Capture Modal (Requirement 2 & 3) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Add Real Photo</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Title / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Evening walk in the park"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Category</label>
                  <select
                    value={newPhotoCategory}
                    onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="Memories">Memories</option>
                    <option value="Trips">Trips</option>
                    <option value="Study">Study</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Visibility</label>
                  <select
                    value={newPhotoVisibility}
                    onChange={(e) => setNewPhotoVisibility(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="SHARED">Shared with Partner</option>
                    <option value="PRIVATE">Private (You Only)</option>
                  </select>
                </div>
              </div>

              {/* REAL PHOTO PICKER */}
              <PhotoPicker
                label="Select Photo"
                required={true}
                parentType={newPhotoCategory.toUpperCase()}
                visibility={newPhotoVisibility}
                ownerId={currentUser.id}
                onPhotoSelected={(url) => setNewPhotoUrl(url)}
                onPhotoRemoved={() => setNewPhotoUrl('')}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newPhotoUrl}
                  onClick={handleSaveUploadedPhoto}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-95 disabled:opacity-40"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
