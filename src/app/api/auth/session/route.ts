import { NextRequest, NextResponse } from 'next/server';
import { AuthDb } from '@/lib/db';
import { getAuthUser } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 });
  return NextResponse.json({ success: true, user, space: AuthDb.firstSpaceForUser(user.id) });
}

