import { NextRequest, NextResponse } from 'next/server';
import { AccessDb, AuthDb, MediaDb, seedInitialDataIfEmpty } from '@/lib/db';
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
    const category = searchParams.get('category') || 'ALL';
    if (!spaceId) return NextResponse.json({ success: true, items: [] });

    const items = MediaDb.list(spaceId, user.id, category);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Failed to list media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
