/**
 * CloudSync Engine for LifeOS
 * Provides reliable, instantaneous real-time multi-device synchronization
 * between phone, laptop, tablet, and all connected devices.
 * Uses native same-origin /api/sync SSE stream with persistent database catch-up.
 */

export interface SyncPayload {
  id?: string;
  senderDeviceId: string;
  action: string;
  timestamp: string;
  data: any;
}

// Generate or retrieve unique persistent device ID so devices never loop own broadcasts
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = window.localStorage.getItem('lifeos_device_id');
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      window.localStorage.setItem('lifeos_device_id', id);
    }
    return id;
  } catch {
    return 'fallback_device';
  }
}

/**
 * Broadcast an action (e.g. task created, task completed with photo proof, habit log, daily note)
 * to all other devices in real-time.
 */
export async function broadcastSyncAction(
  spaceId: string,
  action: SyncPayload['action'],
  data: any
): Promise<void> {
  if (typeof window === 'undefined') return;

  const effectiveSpaceId = spaceId || 'space_lifeos_demo';
  const deviceId = getDeviceId();
  const payload: SyncPayload = {
    senderDeviceId: deviceId,
    action,
    timestamp: new Date().toISOString(),
    data
  };

  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId: effectiveSpaceId,
        action,
        data,
        senderDeviceId: deviceId,
        timestamp: payload.timestamp
      })
    });
  } catch (err) {
    console.warn('[CloudSync] Broadcast error:', err);
  }
}

/**
 * Connect to real-time CloudSync event stream.
 * Automatically catches up on all missed events and listens via Server-Sent Events (SSE)
 * with robust auto-reconnecting background polling for mobile & laptop.
 */
export function initRealtimeCloudSync(
  spaceId: string,
  onRemoteAction: (payload: SyncPayload) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'offline') => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const effectiveSpaceId = spaceId || 'space_lifeos_demo';
  const currentDeviceId = getDeviceId();
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const processedEventIds = new Set<string>();

  const processEvent = (event: any) => {
    if (!event || !event.action) return;

    if (event.id) {
      if (processedEventIds.has(event.id)) return;
      processedEventIds.add(event.id);
      if (processedEventIds.size > 1000) {
        const first = processedEventIds.values().next().value;
        if (first) processedEventIds.delete(first);
      }
    }

    if (event.timestamp) {
      if (new Date(event.timestamp).getTime() > new Date(lastSyncTime).getTime()) {
        lastSyncTime = event.timestamp;
      }
    }

    // Ignore broadcasts originating from this exact device
    if (event.senderDeviceId === currentDeviceId) return;

    onRemoteAction({
      id: event.id,
      senderDeviceId: event.senderDeviceId,
      action: event.action,
      timestamp: event.timestamp || new Date().toISOString(),
      data: event.data
    });
  };

  onStatusChange?.('connecting');

  // 1. Initial catchup & fallback poll function
  const pollMissedEvents = async () => {
    if (isClosed) return;
    try {
      const res = await fetch(`/api/sync?spaceId=${encodeURIComponent(effectiveSpaceId)}&since=${encodeURIComponent(lastSyncTime)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.events)) {
          for (const ev of json.events) {
            processEvent(ev);
          }
          if (json.events.length > 0) {
            onStatusChange?.('connected');
          }
        }
      }
    } catch {
      // Offline fallback
    }
  };

  // Run immediate catchup
  pollMissedEvents();

  // 2. Real-time Server-Sent Events (SSE) direct from internal /api/sync
  const connectSSE = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`/api/sync?spaceId=${encodeURIComponent(effectiveSpaceId)}&stream=1`);

      eventSource.onopen = () => {
        if (!isClosed) onStatusChange?.('connected');
      };

      eventSource.addEventListener('sync', (e: MessageEvent) => {
        if (isClosed) return;
        try {
          const ev = JSON.parse(e.data);
          processEvent(ev);
        } catch {}
      });

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          onStatusChange?.('offline');
          // Reconnect SSE after 3s
          setTimeout(connectSSE, 3000);
        }
      };
    } catch {
      if (!isClosed) {
        onStatusChange?.('offline');
        setTimeout(connectSSE, 4000);
      }
    }
  };

  connectSSE();

  // 3. Mobile PWA Background Resiliency:
  // On iOS Safari / Android Chrome when tab sleeps or phone is unlocked,
  // trigger an immediate poll to fetch any changes made on the other device.
  const pollInterval = setInterval(pollMissedEvents, 3500);

  const onWindowFocus = () => {
    pollMissedEvents();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      pollMissedEvents();
    }
  };

  window.addEventListener('focus', onWindowFocus);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    isClosed = true;
    clearInterval(pollInterval);
    window.removeEventListener('focus', onWindowFocus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
