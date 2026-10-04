'use client';

export interface DueReminderItem {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  task_title?: string;
  category?: string;
  priority?: string;
  scheduled_at: string;
  proof_required?: number;
}

class ReminderEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private isChecking = false;
  private audioCtx: AudioContext | null = null;

  init() {
    if (typeof window === 'undefined') return;

    // Start background polling for due reminders every 15 seconds
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.pollDueReminders();
      }, 15000);
      // Run first check after 2 seconds
      setTimeout(() => this.pollDueReminders(), 2000);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch (e) {
      console.warn('Notification permission error:', e);
      return 'denied';
    }
  }

  isQuietHours(): boolean {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 7; // 11 PM to 7 AM
  }

  playChime() {
    if (this.isQuietHours()) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio autoplay may be restricted until user interaction
    }
  }

  async pollDueReminders() {
    if (this.isChecking || typeof window === 'undefined') return;
    this.isChecking = true;

    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) return;
      const data = await res.json();

      if (data.success && Array.isArray(data.pending) && data.pending.length > 0) {
        for (const rem of data.pending as DueReminderItem[]) {
          await this.triggerNotification(rem);
        }
      }
    } catch (err) {
      // Silent network catch
    } finally {
      this.isChecking = false;
    }
  }

  async triggerNotification(rem: DueReminderItem) {
    // 1. Mark as sent on server immediately to prevent duplicate alerts
    try {
      await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId: rem.id, action: 'MARK_SENT' })
      });
    } catch (e) {}

    // 2. Play gentle audio chime
    this.playChime();

    // 3. Native Browser Notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(rem.title, {
          body: rem.task_title ? `Task due now: "${rem.task_title}"` : 'LIFE OS Reminder',
          icon: '/favicon.ico',
          tag: rem.id
        });
        notif.onclick = () => {
          window.focus();
          window.dispatchEvent(new CustomEvent('lifeos:open_task', { detail: { taskId: rem.task_id } }));
        };
      } catch (e) {}
    }

    // 4. In-App Interactive Toast Event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('lifeos:reminder_alert', {
          detail: rem
        })
      );
    }
  }
}

export const reminderEngine = new ReminderEngine();
