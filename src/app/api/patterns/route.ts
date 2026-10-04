import { NextRequest, NextResponse } from 'next/server';
import { PatternDb, seedInitialDataIfEmpty } from '@/lib/db';
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

    const patterns = PatternDb.list(user.id);
    return NextResponse.json({ success: true, patterns });
  } catch (error: any) {
    console.error('Failed to get patterns:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const body = await req.json();
    const user = await resolveUser(req, body.userId);
    const { action, id, category, pattern, evidence, confidence } = body;

    if (action === 'CONFIRM' && id) {
      PatternDb.confirm(id, user.id);
      return NextResponse.json({ success: true });
    }

    if (action === 'FORGET' && id) {
      PatternDb.forget(id, user.id);
      return NextResponse.json({ success: true });
    }

    if (category && pattern) {
      const newId = PatternDb.record(user.id, category, pattern, evidence || '', confidence || 0.85);
      return NextResponse.json({ success: true, id: newId });
    }

    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update pattern:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
