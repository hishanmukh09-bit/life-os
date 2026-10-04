import { NextRequest, NextResponse } from 'next/server';
import { PatternDb, seedInitialDataIfEmpty } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'user_shanmukh';

    const patterns = PatternDb.list(userId);
    return NextResponse.json({ success: true, patterns });
  } catch (error: any) {
    console.error('Failed to get patterns:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, userId, category, pattern, evidence, confidence } = body;

    if (action === 'CONFIRM' && id) {
      PatternDb.confirm(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'FORGET' && id) {
      PatternDb.forget(id);
      return NextResponse.json({ success: true });
    }

    if (userId && category && pattern) {
      const newId = PatternDb.record(userId, category, pattern, evidence || '', confidence || 0.85);
      return NextResponse.json({ success: true, id: newId });
    }

    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update pattern:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
