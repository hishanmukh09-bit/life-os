'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, X, Smartphone, Monitor, Check, ExternalLink, HelpCircle } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running as installed app already
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    if (isIosDevice) {
      setGuidePlatform('ios');
    } else if (isAndroidDevice) {
      setGuidePlatform('android');
    } else {
      setGuidePlatform('desktop');
    }

    // Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsDismissed(false);
    };

    const handleOpenGuide = () => {
      setIsDismissed(false);
      setShowGuide(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('lifeos:open-install-guide', handleOpenGuide);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('lifeos:open-install-guide', handleOpenGuide);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsDismissed(true);
        }
        setDeferredPrompt(null);
      } catch (e) {
        setShowGuide(true);
      }
    } else {
      // If native prompt is not yet ready or supported, show the direct installation guide
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in slide-in-from-bottom-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {guidePlatform === 'desktop' ? (
                <Monitor className="h-5 w-5" />
              ) : (
                <Smartphone className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Install LifeOS App</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">Native PWA</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Full-screen app, live cross-device sync & offline access.
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

        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/50">
          <button
            onClick={() => setShowGuide(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>How to install</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-transform active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Universal Step-by-Step Installation Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">How to Install LifeOS</h3>
                  <p className="text-[11px] text-muted-foreground">Select your current device below</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
              <button
                onClick={() => setGuidePlatform('desktop')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  guidePlatform === 'desktop'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Laptop / PC
              </button>
              <button
                onClick={() => setGuidePlatform('ios')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  guidePlatform === 'ios'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                onClick={() => setGuidePlatform('android')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  guidePlatform === 'android'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Android
              </button>
            </div>

            {/* Platform Instructions */}
            {guidePlatform === 'desktop' && (
              <div className="space-y-3 py-1 text-xs text-muted-foreground">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-foreground font-medium flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-primary shrink-0" />
                  <span>On Chrome & Edge, look at the <strong>Address Bar</strong> (top right).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Click the <strong>Install icon</strong> (screen with down arrow 💻 ⬇) located inside the right side of the address bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Alternatively, click the browser menu (<strong>⋮</strong> three dots) &rarr; <strong>&ldquo;Cast, save, and share&rdquo;</strong> &rarr; <strong>&ldquo;Install LifeOS&rdquo;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Click <strong>Install</strong>. LifeOS opens as a separate, distraction-free desktop application with its own taskbar icon!</span>
                </div>
              </div>
            )}

            {guidePlatform === 'ios' && (
              <div className="space-y-3 py-1 text-xs text-muted-foreground">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-foreground font-medium flex items-center gap-2.5">
                  <Share2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Open this website in <strong>Safari</strong> on iPhone or iPad.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button (box with an arrow pointing up <span className="font-bold text-foreground">⎋</span>) at the bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and select <strong>&ldquo;Add to Home Screen&rdquo;</strong> (with a <span className="font-bold text-foreground">➕</span> icon).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top right corner. The LifeOS app icon is now on your home screen and launches without browser tabs!</span>
                </div>
              </div>
            )}

            {guidePlatform === 'android' && (
              <div className="space-y-3 py-1 text-xs text-muted-foreground">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-foreground font-medium flex items-center gap-2.5">
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  <span>Open in <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Samsung Internet</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Tap the browser menu (<strong>⋮</strong> three dots) in the top or bottom right corner.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>Install</strong>. LifeOS installs directly into your Android app drawer with full push notification support!</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-95"
                >
                  Prompt Install Dialog Now
                </button>
              )}
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-semibold text-xs hover:bg-muted/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
