import { NextRequest, NextResponse } from 'next/server';
import { NotificationDb, seedInitialDataIfEmpty } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

async function resolveUser(req: NextRequest, fallbackUserId?: string) {
  const sessionUser = await getAuthUser(req);
  if (sessionUser) return sessionUser;
  
  const userId = fallbackUserId || 'user_shanmukh';
  const name = userId === 'user_satvika' ? 'Satvika' : 'Shanmukh';
  return { id: userId, name, email: `${userId}@lifeos.me` };
}

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get('userId') || undefined;
    const user = await resolveUser(req, paramUserId);

    const notifications = NotificationDb.list(user.id);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const user = await resolveUser(req, body.userId);
    const { action, id } = body;

    if (action === 'MARK_READ' && id) {
      NotificationDb.markReadForUser(id, user.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'MARK_ALL_READ') {
      NotificationDb.markAllRead(user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
