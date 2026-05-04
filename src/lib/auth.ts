import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

const COOKIE_NAME = 'fintrack_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const HASH_ITERATIONS = 120_000;
const HASH_LENGTH = 32;

type SessionPayload = {
  sub: string;
  exp: number;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

type UserProjection = {
  _id: unknown;
  name: string;
  email: string;
  avatarColor: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeVaultKey(vaultKey: string): string {
  return vaultKey.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getSessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.MONGODB_URI || 'fintrack-local-session-secret';
}

export function hashVaultKey(vaultKey: string, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(
    normalizeVaultKey(vaultKey),
    salt,
    HASH_ITERATIONS,
    HASH_LENGTH,
    'sha256'
  ).toString('hex');

  return { hash, salt };
}

export function verifyVaultKey(vaultKey: string, expectedHash: string, salt: string): boolean {
  const { hash } = hashVaultKey(vaultKey, salt);
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(hash, 'hex');

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function signPayload(encodedPayload: string): string {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function parseSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature || signature !== signPayload(encodedPayload)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function attachSessionCookie(response: NextResponse, userId: string): void {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? parseSessionToken(token) : null;

  if (!payload) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(payload.sub)
    .select('_id name email avatarColor')
    .lean<UserProjection | null>();

  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: 'Please log in to continue' },
    { status: 401 }
  );
}
