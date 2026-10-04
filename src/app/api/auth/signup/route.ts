import { NextRequest, NextResponse } from 'next/server';
import { AuthDb } from '@/lib/db';
import { attachSessionCookie, createSession, hashPassword } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ success: false, error: 'INVALID_SIGNUP_FIELDS' }, { status: 400 });
    }
    if (AuthDb.findByEmail(email)) {
      return NextResponse.json({ success: false, error: 'EMAIL_ALREADY_EXISTS' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const created = AuthDb.createUser({ name, email, passwordHash });
    const user = { id: created.id, name, email };
    const token = await createSession(user);
    const res = NextResponse.json({ success: true, user, spaceId: created.spaceId, inviteCode: created.inviteCode }, { status: 201 });
    attachSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error('Signup failed:', error);
    return NextResponse.json({ success: false, error: 'SIGNUP_FAILED' }, { status: 500 });
  }
}

