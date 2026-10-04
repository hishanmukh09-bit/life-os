import { NextRequest, NextResponse } from 'next/server';
import { NotificationDb, seedInitialDataIfEmpty } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_shanmukh';

    const notifications = NotificationDb.list(userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, userId, title, body: msgBody, type, relatedId } = body;

    if (action === 'MARK_READ' && id) {
      NotificationDb.markRead(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'MARK_ALL_READ' && userId) {
      NotificationDb.markAllRead(userId);
      return NextResponse.json({ success: true });
    }

    if (userId && title && msgBody) {
      const newId = NotificationDb.create({ userId, title, body: msgBody, type: type || 'TASK_REMINDER', relatedId });
      return NextResponse.json({ success: true, id: newId });
    }

    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
