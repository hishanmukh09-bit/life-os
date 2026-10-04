import { NextRequest, NextResponse } from 'next/server';
import { AccessDb, AuthDb, TaskDb, seedInitialDataIfEmpty } from '@/lib/db';
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
    
    const defaultSpace = AuthDb.firstSpaceForUser(user.id);
    const spaceId = searchParams.get('spaceId') || defaultSpace?.id || 'space_lifeos_demo';
    const includeTrash = searchParams.get('trash') === 'true';

    const tasks = TaskDb.list(spaceId, user.id, includeTrash);
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error('Failed to list tasks:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const user = await resolveUser(req, body.creatorId || body.userId);
    const defaultSpace = AuthDb.firstSpaceForUser(user.id);
    const spaceId = body.spaceId || defaultSpace?.id || 'space_lifeos_demo';

    if (!body.title) {
      return NextResponse.json({ success: false, error: 'MISSING_REQUIRED_FIELDS' }, { status: 400 });
    }

    const taskPayload = {
      ...body,
      creatorId: user.id,
      spaceId
    };

    const taskId = TaskDb.create(taskPayload);
    return NextResponse.json(
      { success: true, taskId, task: { id: taskId, ...taskPayload } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

async function handleUpdate(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const taskId = body.taskId || body.id;
    const action = body.action || (body.completed !== undefined ? 'TOGGLE' : undefined);
    const user = await resolveUser(req, body.userId);
    const proofImg = body.proofImg || body.proofUrl;
    const minutes = body.minutes;
    const newDate = body.newDate || body.dueDate;
    const newTime = body.newTime || body.dueTime;
    const updates = body.updates;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'MISSING_TASK_ID' }, { status: 400 });
    }

    if (action === 'TOGGLE' || action === 'TOGGLE_COMPLETE') {
      const res = TaskDb.toggle(taskId, user.id, user.name, proofImg);
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
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
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
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'MISSING_TASK_ID' }, { status: 400 });
    }
    TaskDb.delete(taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
