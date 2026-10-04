import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

const SESSION_COOKIE = 'lifeos_session';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-change-me');

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: AuthUser) {
  return new SignJWT({ sub: user.id, name: user.name, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    const db = getDb();
    const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(payload.sub) as AuthUser | undefined;
    return row || null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'AUTH_REQUIRED' }, { status: 401 });
  }
  return user;
}

export function isAuthResponse(value: AuthUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

