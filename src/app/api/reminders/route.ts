import { NextRequest, NextResponse } from 'next/server';
import { AccessDb, ReminderDb, seedInitialDataIfEmpty } from '@/lib/db';
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
    const mode = searchParams.get('mode'); // 'pending' | 'all'

    if (mode === 'all') {
      const reminders = ReminderDb.getAllForUser(user.id);
      return NextResponse.json({ success: true, reminders });
    }

    const pending = ReminderDb.getPending(user.id);
    return NextResponse.json({ success: true, pending });
  } catch (error: any) {
    console.error('Failed to get reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const user = await resolveUser(req, body.userId);
    const { taskId, title, scheduledAt, offsetMinutes, type } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'MISSING_REMINDER_FIELDS' }, { status: 400 });
    }
    if (taskId) AccessDb.getTaskForAccess(taskId, user.id);

    const id = ReminderDb.create({
      userId: user.id,
      taskId,
      title,
      type: type || 'TASK_DUE',
      scheduledAt,
      offsetMinutes: offsetMinutes || 0
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const user = await resolveUser(req, body.userId);
    const { reminderId, action } = body;

    if (!reminderId) {
      return NextResponse.json({ success: false, error: 'MISSING_REMINDER_ID' }, { status: 400 });
    }

    if (action === 'DISMISS') {
      ReminderDb.markSent(reminderId);
      return NextResponse.json({ success: true });
    }

    if (action === 'SNOOZE') {
      const minutes = body.minutes || 10;
      const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      ReminderDb.snooze(reminderId, until);
      return NextResponse.json({ success: true, snoozedUntil: until });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
