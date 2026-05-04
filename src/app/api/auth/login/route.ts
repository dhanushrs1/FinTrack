import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import {
  attachSessionCookie,
  normalizeEmail,
  verifyVaultKey,
  type AuthUser,
} from '@/lib/auth';
import User from '@/models/User';

type LoginPayload = {
  email?: unknown;
  vaultKey?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload;
    const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const vaultKey = typeof body.vaultKey === 'string' ? body.vaultKey.trim() : '';

    if (!email || !vaultKey) {
      return NextResponse.json({ success: false, error: 'Email and Vault Key are required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    if (!user || !verifyVaultKey(vaultKey, user.vaultKeyHash, user.vaultKeySalt)) {
      return NextResponse.json({ success: false, error: 'Email or Vault Key is incorrect' }, { status: 401 });
    }

    const authUser: AuthUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
    };
    const response = NextResponse.json({ success: true, user: authUser });
    attachSessionCookie(response, authUser.id);

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to log in' }, { status: 500 });
  }
}
