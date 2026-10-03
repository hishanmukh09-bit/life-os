'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { X, Trash2, RefreshCw, Camera, Calendar, ShieldCheck } from 'lucide-react';

export function PhotoLightboxModal() {
  const { lightbox, closeLightbox, deleteTaskProof, replaceTaskProof } = useLifeOS();
  const [showReplaceInput, setShowReplaceInput] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  if (!lightbox) return null;

  const handleReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !lightbox.taskId) return;
    replaceTaskProof(lightbox.taskId, newUrl.trim());
    setShowReplaceInput(false);
    closeLightbox();
  };

  const handleDelete = () => {
    if (lightbox.taskId) {
      deleteTaskProof(lightbox.taskId);
    }
    closeLightbox();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative max-w-3xl w-full rounded-3xl border border-white/10 bg-card overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-background/50">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">{lightbox.title || 'Verified Photo Proof'}</h3>
            {lightbox.timestamp && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Captured {lightbox.timestamp}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lightbox.taskId && (
              <>
                <button
                  onClick={() => setShowReplaceInput(!showReplaceInput)}
                  title="Replace Photo"
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  title="Delete Proof"
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={closeLightbox}
              className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Replace Input Bar if triggered */}
        {showReplaceInput && (
          <form onSubmit={handleReplace} className="flex gap-2 p-3 bg-secondary/50 border-b border-border text-xs">
            <input
              type="text"
              placeholder="Paste new image URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-foreground"
            />
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold">
              Save
            </button>
          </form>
        )}

        {/* Image Full View */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
          <img
            src={lightbox.url}
            alt={lightbox.title || 'Full Photo Proof'}
            className="max-h-[65vh] w-auto rounded-2xl object-contain shadow-lg"
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-background/50 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between px-5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Private Encrypted Proof
          </span>
          <span>LIFE OS Photo-First Architecture</span>
        </div>

      </div>
    </div>
  );
}
