'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, X, Smartphone, Check } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as installed app already
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check dismissal status
    const dismissedUntil = window.localStorage.getItem('lifeos_pwa_dismissed');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }
    setIsDismissed(false);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      // Dismiss for 7 days
      window.localStorage.setItem('lifeos_pwa_dismissed', String(Date.now() + 7 * 86400000));
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md p-4 shadow-xl animate-in slide-in-from-bottom-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Install LifeOS on Phone & Laptop</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Fast offline access, native alerts, and full-screen workspace.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border/50">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:opacity-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                Add to iPhone / iPad Home Screen
              </span>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                <span>In Safari, tap the <strong>Share</strong> button (box with an arrow pointing up <span className="text-sm">⎋</span>) in the toolbar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> (with a <span className="text-sm">➕</span> icon).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                <span>Tap <strong>Add</strong> in the top right corner. LifeOS will now open full-screen just like a native app!</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
