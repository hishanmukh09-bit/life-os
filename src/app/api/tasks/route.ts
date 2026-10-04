import { NextRequest, NextResponse } from 'next/server';
import { TaskDb, seedInitialDataIfEmpty } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId') || 'space_lifeos_demo';
    const userId = searchParams.get('userId') || 'user_shanmukh';
    const includeTrash = searchParams.get('trash') === 'true';

    const tasks = TaskDb.list(spaceId, userId, includeTrash);
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error('Failed to list tasks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const creatorId = body.creatorId || body.userId || 'user_shanmukh';
    const spaceId = body.spaceId || 'space_lifeos_demo';

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 });
    }

    const taskPayload = {
      ...body,
      creatorId,
      spaceId
    };

    const taskId = TaskDb.create(taskPayload);
    return NextResponse.json(
      { success: true, taskId, task: { id: taskId, ...taskPayload } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleUpdate(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const taskId = body.taskId || body.id;
    const action = body.action || (body.completed !== undefined ? 'TOGGLE' : undefined);
    const userId = body.userId || 'user_shanmukh';
    const userName = body.userName || 'Shanmukh';
    const proofImg = body.proofImg || body.proofUrl;
    const minutes = body.minutes;
    const newDate = body.newDate || body.dueDate;
    const newTime = body.newTime || body.dueTime;
    const updates = body.updates;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'MISSING_TASK_ID' }, { status: 400 });
    }

    if (action === 'TOGGLE' || action === 'TOGGLE_COMPLETE') {
      const res = TaskDb.toggle(taskId, userId, userName, proofImg);
      if (!res.success && res.error === 'PROOF_REQUIRED') {
        return NextResponse.json({ success: false, error: 'PROOF_REQUIRED' }, { status: 400 });
      }
      return NextResponse.json(res);
    }

    if (action === 'SNOOZE') {
      const ok = TaskDb.snooze(taskId, minutes || 30);
      return NextResponse.json({ success: ok });
    }

    if (action === 'RESCHEDULE') {
      TaskDb.update(taskId, { dueDate: newDate, dueTime: newTime });
      return NextResponse.json({ success: true });
    }

    if (action === 'RESTORE') {
      TaskDb.restore(taskId);
      return NextResponse.json({ success: true });
    }

    if (updates) {
      TaskDb.update(taskId, updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'INVALID_ACTION' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'MISSING_TASK_ID' }, { status: 400 });
    }
    TaskDb.delete(taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
