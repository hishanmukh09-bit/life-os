import { NextRequest, NextResponse } from 'next/server';
import { ReminderDb, NotificationDb, seedInitialDataIfEmpty } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const mode = searchParams.get('mode'); // 'pending' | 'all'

    if (mode === 'all' && userId) {
      const reminders = ReminderDb.getAllForUser(userId);
      return NextResponse.json({ success: true, reminders });
    }

    // Default: return pending reminders ready to trigger right now
    const pending = ReminderDb.getPending(userId);
    return NextResponse.json({ success: true, pending });
  } catch (error: any) {
    console.error('Failed to get reminders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const { userId, taskId, title, scheduledAt, offsetMinutes, type } = body;

    if (!userId || !title || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'MISSING_REMINDER_FIELDS' }, { status: 400 });
    }

    const id = ReminderDb.create({
      userId,
      taskId,
      title,
      type: type || 'TASK_DUE',
      scheduledAt,
      offsetMinutes: offsetMinutes || 0
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to create reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { reminderId, action } = body;

    if (!reminderId) {
      return NextResponse.json({ success: false, error: 'MISSING_REMINDER_ID' }, { status: 400 });
    }

    if (action === 'MARK_SENT') {
      ReminderDb.markSent(reminderId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update reminder:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
