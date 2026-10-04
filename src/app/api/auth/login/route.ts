import { NextRequest, NextResponse } from 'next/server';
import { AuthDb } from '@/lib/db';
import { attachSessionCookie, createSession, verifyPassword } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const row = AuthDb.findByEmail(email);
    if (!row?.password_hash || !(await verifyPassword(password, row.password_hash))) {
      return NextResponse.json({ success: false, error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }
    const user = { id: row.id, name: row.name, email: row.email };
    const token = await createSession(user);
    const res = NextResponse.json({ success: true, user, space: AuthDb.firstSpaceForUser(row.id) });
    attachSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error('Login failed:', error);
    return NextResponse.json({ success: false, error: 'LOGIN_FAILED' }, { status: 500 });
  }
}

