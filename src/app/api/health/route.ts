import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }
}
