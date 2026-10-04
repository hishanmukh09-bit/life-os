import { NextRequest, NextResponse } from 'next/server';
import { MediaDb, seedInitialDataIfEmpty } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    seedInitialDataIfEmpty();
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId') || 'space_lifeos_demo';
    const userId = searchParams.get('userId') || 'user_shanmukh';
    const category = searchParams.get('category') || 'ALL';

    const items = MediaDb.list(spaceId, userId, category);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Failed to list media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
