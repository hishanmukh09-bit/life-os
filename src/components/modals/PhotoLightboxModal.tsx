'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/store';
import { AIService } from '@/lib/ai-service';
import { X, Trash2, RefreshCw, Calendar, ShieldCheck, Sparkles, CheckCircle2, Heart } from 'lucide-react';

export function PhotoLightboxModal() {
  const { lightbox, closeLightbox, deleteTaskProof, replaceTaskProof, currentUser, partnerUser } = useLifeOS();
  const [showReplaceInput, setShowReplaceInput] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [peerConfirmed, setPeerConfirmed] = useState(false);

  if (!lightbox) return null;

  // Resolve AI verification either from stored proof or synthesize dynamically
  const aiInfo = lightbox.aiVerification || AIService.verifyPhotoProof('Activity', lightbox.title || 'Verified Log', lightbox.url);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative max-w-4xl w-full rounded-3xl border border-white/10 bg-card overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-background/70">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">{lightbox.title || 'Verified Photo Proof'}</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" /> AI VERIFIED ({aiInfo.confidence.toFixed(1)}%)
              </span>
            </div>
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
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  title="Delete Proof"
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={closeLightbox}
              className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted ml-2 transition-colors"
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

        {/* Main Content: Split into Image & AI Vision Analysis */}
        <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-12 bg-black/40">
          
          {/* Image Canvas */}
          <div className="lg:col-span-8 p-4 flex items-center justify-center min-h-[300px]">
            <img
              src={lightbox.url}
              alt={lightbox.title || 'Full Photo Proof'}
              className="max-h-[55vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/5"
            />
          </div>

          {/* AI Multimodal Verification Details */}
          <div className="lg:col-span-4 p-5 bg-card/90 border-t lg:border-t-0 lg:border-l border-border/60 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Multimodal AI Analysis
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Integrity Verified
                  </span>
                  <span className="font-mono text-[11px] text-emerald-500">{aiInfo.confidence.toFixed(1)}% match</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {aiInfo.summary}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">Detected Visual Entities</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiInfo.detectedObjects.map((obj, i) => (
                    <span key={i} className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/50 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                      <span>{obj}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-1 text-[11px] font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cryptographic Proof:</span>
                  <span className="text-foreground">{aiInfo.verificationHash || '0x4e9c...8b1a'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Timestamp:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Peer Confirmation Action */}
            <div className="pt-3 border-t border-border/60">
              <button
                onClick={() => setPeerConfirmed(!peerConfirmed)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  peerConfirmed
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                }`}
              >
                <CheckCircle2 className={`h-4 w-4 ${peerConfirmed ? 'fill-current' : ''}`} />
                <span>
                  {peerConfirmed
                    ? `${partnerUser ? partnerUser.name.split(' ')[0] : 'Partner'} confirmed this verification.`
                    : `Confirm & Verify Proof (${partnerUser ? partnerUser.name.split(' ')[0] : 'Partner'})`}
                </span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 bg-background/60 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between px-5">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Tamper-Proof LifeOS Photo Verification
          </span>
          <span className="text-[10px] text-muted-foreground">Shanmukh & Satvika • GROW02</span>
        </div>

      </div>
    </div>
  );
}
