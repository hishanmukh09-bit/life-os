import { NextRequest, NextResponse } from 'next/server';
import { SyncEventDb, seedInitialDataIfEmpty } from '@/lib/db';

type SyncSubscriber = (event: any) => void;

// In-memory real-time SSE pub-sub subscribers per spaceId
const subscribersBySpace = new Map<string, Set<SyncSubscriber>>();

function addSubscriber(spaceId: string, sub: SyncSubscriber) {
  let set = subscribersBySpace.get(spaceId);
  if (!set) {
    set = new Set();
    subscribersBySpace.set(spaceId, set);
  }
  set.add(sub);
  return () => {
    set?.delete(sub);
    if (set && set.size === 0) {
      subscribersBySpace.delete(spaceId);
    }
  };
}

function notifySubscribers(spaceId: string, event: any) {
  const set = subscribersBySpace.get(spaceId);
  if (set) {
    set.forEach((sub) => {
      try {
        sub(event);
      } catch {}
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const spaceId = body.spaceId || 'space_lifeos_demo';
    const action = body.action;
    const data = body.data;
    const senderDeviceId = body.senderDeviceId || 'unknown_device';

    if (!action) {
      return NextResponse.json({ success: false, error: 'MISSING_ACTION' }, { status: 400 });
    }

    const recorded = SyncEventDb.record(spaceId, senderDeviceId, action, data);

    // Notify connected SSE clients immediately in memory
    notifySubscribers(spaceId, recorded);

    return NextResponse.json({ success: true, event: recorded }, { status: 200 });
  } catch (err: any) {
    console.error('[Sync API] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId') || 'space_lifeos_demo';
    const since = searchParams.get('since') || undefined;
    const isStream = searchParams.get('stream') === '1' || req.headers.get('accept') === 'text/event-stream';

    // 1. If Client requests Live Real-Time SSE Stream
    if (isStream) {
      const encoder = new TextEncoder();
      let unsubscribe: (() => void) | null = null;
      let pingInterval: NodeJS.Timeout | null = null;

      const stream = new ReadableStream({
        start(controller) {
          // Send initial connection event
          controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ spaceId, time: new Date().toISOString() })}\n\n`));

          // Catch-up: send recent events immediately on stream open
          try {
            const recentEvents = SyncEventDb.listSince(spaceId, since);
            for (const ev of recentEvents) {
              controller.enqueue(encoder.encode(`event: sync\ndata: ${JSON.stringify(ev)}\n\n`));
            }
          } catch {}

          // Subscribe to live events
          unsubscribe = addSubscriber(spaceId, (ev) => {
            try {
              controller.enqueue(encoder.encode(`event: sync\ndata: ${JSON.stringify(ev)}\n\n`));
            } catch {}
          });

          // Keep alive heartbeat ping every 15s to prevent mobile timeouts
          pingInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`: ping\n\n`));
            } catch {}
          }, 15000);
        },
        cancel() {
          if (unsubscribe) unsubscribe();
          if (pingInterval) clearInterval(pingInterval);
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // 2. Standard Poll: return events since timestamp
    const events = SyncEventDb.listSince(spaceId, since);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error('[Sync API] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
