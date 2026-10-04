/**
 * CloudSync Engine for LifeOS
 * Provides real-time, multi-device synchronization between phone, laptop, and all devices.
 * Uses HTTP/SSE pub-sub relay with automatic catchup and peer state synchronization.
 */

export interface SyncPayload {
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

export function getSyncTopic(spaceId: string): string {
  const cleanId = (spaceId || 'space_lifeos_demo').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `lifeos_sync_shanmukh_${cleanId}`;
}

/**
 * Broadcast an action (e.g. task created, task completed with photo proof) to all other devices in real-time.
 */
export async function broadcastSyncAction(
  spaceId: string,
  action: SyncPayload['action'],
  data: any
): Promise<void> {
  if (typeof window === 'undefined') return;

  const topic = getSyncTopic(spaceId);
  const deviceId = getDeviceId();
  const payload: SyncPayload = {
    senderDeviceId: deviceId,
    action,
    timestamp: new Date().toISOString(),
    data
  };

  const jsonStr = JSON.stringify(payload);

  // If payload is small (< 3500 chars), send directly as raw text in POST body for sub-100ms instant relay
  if (jsonStr.length < 3500) {
    try {
      const res = await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: jsonStr
      });
      if (res.ok) return;
    } catch {
      // Fallback to attachment
    }
  }

  // If payload is larger (e.g. photo proof or full sync), send as attachment
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'PUT',
      headers: {
        Filename: `sync_${action.toLowerCase()}_${Date.now()}.json`,
        'X-Title': `LifeOS Sync ${action}`,
        'X-Message': action
      },
      body: jsonStr
    });
  } catch (err) {
    console.warn('[CloudSync] Broadcast error:', err);
  }
}

/**
 * Connect to real-time CloudSync event stream.
 * Automatically catches up on events and listens via Server-Sent Events (SSE).
 */
export function initRealtimeCloudSync(
  spaceId: string,
  onRemoteAction: (payload: SyncPayload) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'offline') => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const topic = getSyncTopic(spaceId);
  const currentDeviceId = getDeviceId();
  let eventSource: EventSource | null = null;
  let isClosed = false;
  const processedMessageIds = new Set<string>();

  const handleRawMessage = async (msgId: string | undefined, msgText: string, attachmentUrl?: string) => {
    if (msgId) {
      if (processedMessageIds.has(msgId)) return;
      processedMessageIds.add(msgId);
      // Keep set bounded to last 500 messages
      if (processedMessageIds.size > 500) {
        const first = processedMessageIds.values().next().value;
        if (first) processedMessageIds.delete(first);
      }
    }

    try {
      let parsed: SyncPayload | null = null;

      if (attachmentUrl) {
        // Download attachment payload
        const res = await fetch(attachmentUrl);
        if (res.ok) {
          parsed = await res.json();
        }
      } else if (msgText) {
        parsed = JSON.parse(msgText);
      }

      if (!parsed || !parsed.senderDeviceId || !parsed.action) return;

      // Ignore our own broadcasts
      if (parsed.senderDeviceId === currentDeviceId) return;

      onRemoteAction(parsed);
    } catch {
      // Ignore heartbeat/ping formatting
    }
  };

  onStatusChange?.('connecting');

  // 1. Initial catchup: Poll recent events from last 24 hours
  fetch(`https://ntfy.sh/${topic}/json?poll=1&since=24h`)
    .then((r) => r.text())
    .then((text) => {
      if (isClosed) return;
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line);
          if (item.event === 'message') {
            handleRawMessage(item.id, item.message, item.attachment?.url);
          }
        } catch {}
      }
    })
    .catch(() => {});

  // 2. Real-time Live Server-Sent Events (SSE)
  const connectSSE = () => {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`);

      eventSource.onopen = () => {
        if (!isClosed) onStatusChange?.('connected');
      };

      eventSource.onmessage = (event) => {
        if (isClosed) return;
        try {
          const item = JSON.parse(event.data);
          if (item.event === 'message') {
            handleRawMessage(item.id, item.message, item.attachment?.url);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          onStatusChange?.('offline');
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

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
