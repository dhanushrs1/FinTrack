import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import {
  attachSessionCookie,
  hashVaultKey,
  normalizeEmail,
  type AuthUser,
} from '@/lib/auth';
import User from '@/models/User';

type RegisterPayload = {
  name?: unknown;
  email?: unknown;
  vaultKey?: unknown;
  avatarColor?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const vaultKey = typeof body.vaultKey === 'string' ? body.vaultKey.trim() : '';
    const avatarColor = typeof body.avatarColor === 'string' && COLOR_PATTERN.test(body.avatarColor)
      ? body.avatarColor
      : '#4f46e5';

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ success: false, error: 'Name must be between 2 and 60 characters' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address' }, { status: 400 });
    }

    if (vaultKey.length < 12) {
      return NextResponse.json({ success: false, error: 'Vault Key must be at least 12 characters' }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email }).select('_id').lean();

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'An account already exists for this email' }, { status: 409 });
    }

    const { hash, salt } = hashVaultKey(vaultKey);
    const user = await User.create({
      name,
      email,
      avatarColor,
      vaultKeyHash: hash,
      vaultKeySalt: salt,
    });

    const authUser: AuthUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    };
    const response = NextResponse.json({ success: true, user: authUser }, { status: 201 });
    attachSessionCookie(response, authUser.id);

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 });
  }
}
