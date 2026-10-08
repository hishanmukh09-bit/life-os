/**
 * CloudSync for LifeOS: the server (/api/sync) holds every task, note, habit, etc.
 * Devices push changed items, and get an SSE "changed" ping whenever anything
 * changes, then pull only what's new (by seq). Catch-up after sleep/offline is
 * just another pull, so nothing is ever missed.
 */

export interface SyncItem {
  collection: string;
  id: string;
  data?: any;
  deleted?: boolean;
  seq?: number;
}

export type SyncStatus = 'connecting' | 'connected' | 'offline';

// Fast 53-bit string hash (cyrb53), used to detect which items changed.
export function hashString(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// Inter-tab / local broadcast channel for 0ms cross-tab real-time sync
const SYNC_CHANNEL_NAME = 'lifeos_sync_broadcast_v1';
let globalBroadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!globalBroadcastChannel) {
    try {
      globalBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    } catch {
      globalBroadcastChannel = null;
    }
  }
  return globalBroadcastChannel;
}

export function broadcastSyncPing(spaceId: string) {
  try {
    const bc = getBroadcastChannel();
    bc?.postMessage({ type: 'sync_ping', spaceId, timestamp: Date.now() });
  } catch {}
}

export async function pushItems(spaceId: string, items: SyncItem[]): Promise<{ ok: boolean; seq?: number }> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceId, items })
    });
    if (!res.ok) return { ok: false };
    const json = await res.json().catch(() => ({}));
    return { ok: Boolean(json.success), seq: typeof json.seq === 'number' ? json.seq : undefined };
  } catch {
    return { ok: false };
  }
}

export async function pullItems(spaceId: string, since: number): Promise<{ items: SyncItem[]; seq: number } | null> {
  try {
    const res = await fetch(`/api/sync?spaceId=${encodeURIComponent(spaceId)}&since=${since}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? { items: json.items || [], seq: json.seq ?? since } : null;
  } catch {
    return null;
  }
}

/**
 * Keep an SSE connection open and call onChange() whenever the server has new data
 * (and on every (re)connect, wake-from-sleep, focus, network return, or inter-tab broadcast).
 */
export function subscribeToChanges(
  spaceId: string,
  onChange: () => void,
  onStatus: (status: SyncStatus) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  let es: EventSource | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const handlePing = () => {
    if (closed) return;
    onChange();
  };

  const connect = () => {
    if (closed) return;
    if (retry) { clearTimeout(retry); retry = null; }
    es?.close();
    onStatus('connecting');

    try {
      es = new EventSource(`/api/sync?spaceId=${encodeURIComponent(spaceId)}&stream=1`);
      es.onopen = () => {
        if (closed) return;
        onStatus('connected');
        handlePing();
      };
      es.addEventListener('changed', handlePing);
      es.onmessage = handlePing;
      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        onStatus('offline');
        retry = setTimeout(connect, 3000);
      };
    } catch {
      onStatus('offline');
      retry = setTimeout(connect, 3000);
    }
  };

  // Phones kill SSE silently while the screen is off: reconnect + catch up when back.
  const wake = () => {
    if (document.visibilityState !== 'visible') return;
    if (!es || es.readyState === EventSource.CLOSED) connect();
    handlePing();
  };

  // Listen to other browser tabs on the same computer/browser
  const bc = getBroadcastChannel();
  const onBcMessage = (ev: MessageEvent) => {
    if (ev.data?.spaceId === spaceId) {
      handlePing();
    }
  };
  bc?.addEventListener('message', onBcMessage);

  connect();
  // Trigger initial catch-up immediately
  handlePing();

  // Safety net in case a ping is lost on a flaky network
  const poll = setInterval(handlePing, 10000);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('focus', wake);
  window.addEventListener('online', wake);

  return () => {
    closed = true;
    clearInterval(poll);
    if (retry) clearTimeout(retry);
    bc?.removeEventListener('message', onBcMessage);
    document.removeEventListener('visibilitychange', wake);
    window.removeEventListener('focus', wake);
    window.removeEventListener('online', wake);
    es?.close();
  };
}
