import { NextRequest, NextResponse } from 'next/server';
import { SyncStateDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Listener = (seq: number) => void;

// Live SSE listeners per space. Kept on globalThis so every route module instance shares it.
// ponytail: in-memory fan-out, needs ONE server process; use Redis/Postgres LISTEN to scale out.
const g = globalThis as unknown as { __lifeosSyncListeners?: Map<string, Set<Listener>> };
const listeners: Map<string, Set<Listener>> = (g.__lifeosSyncListeners ??= new Map());

function notify(spaceId: string, seq: number) {
  listeners.get(spaceId)?.forEach((fn) => {
    try { fn(seq); } catch {}
  });
}

// Push changed items: { spaceId, items: [{ collection, id, data?, deleted? }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spaceId = body.spaceId || 'space_lifeos_demo';
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ success: false, error: 'MISSING_ITEMS' }, { status: 400 });
    }
    const seq = SyncStateDb.upsert(spaceId, body.items);
    notify(spaceId, seq);
    return NextResponse.json({ success: true, seq });
  } catch (err: any) {
    console.error('[Sync API] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ?since=N -> items changed after seq N.  ?stream=1 -> SSE "changed" pings.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const spaceId = searchParams.get('spaceId') || 'space_lifeos_demo';

  if (searchParams.get('stream') !== '1') {
    try {
      const since = Number(searchParams.get('since')) || 0;
      return NextResponse.json({ success: true, ...SyncStateDb.since(spaceId, since) }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    } catch (err: any) {
      console.error('[Sync API] GET error:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try { controller.enqueue(encoder.encode(chunk)); } catch { cleanup(); }
      };
      const listener: Listener = (seq) => send(`event: changed\ndata: ${seq}\n\n`);
      let set = listeners.get(spaceId);
      if (!set) listeners.set(spaceId, (set = new Set()));
      set.add(listener);
      const ping = setInterval(() => send(`: ping\n\n`), 15000);

      cleanup = () => {
        clearInterval(ping);
        set!.delete(listener);
        if (set!.size === 0) listeners.delete(spaceId);
      };
      req.signal.addEventListener('abort', () => {
        cleanup();
        try { controller.close(); } catch {}
      });
      send(`retry: 2000\nevent: changed\ndata: 0\n\n`);
    },
    cancel() {
      cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
