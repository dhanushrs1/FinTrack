import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth';
import Transaction from '@/models/Transaction';

const MAX_AMOUNT = 1_000_000;

type TransactionPayload = {
  title?: unknown;
  amount?: unknown;
  type?: unknown;
  category?: unknown;
  date?: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    await connectToDatabase();

    const limitParam = request.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? Number(limitParam) : 0;
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 0;

    const query = Transaction.find({ userId: user.id }).sort({ date: -1 });
    if (limit > 0) {
      query.limit(limit);
    }

    const transactions = await query.lean();
    return NextResponse.json({ success: true, data: transactions });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const body = (await request.json()) as TransactionPayload;
    const amount = Number(body.amount);
    const type = body.type === 'income' || body.type === 'expense' ? body.type : null;
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim()
      : category;
    const date = body.date ? new Date(String(body.date)) : new Date();

    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0 and no more than 1000000' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json({ success: false, error: 'Transaction type must be income or expense' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }

    if (title.length > 50) {
      return NextResponse.json({ success: false, error: 'Title cannot be more than 50 characters' }, { status: 400 });
    }

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ success: false, error: 'Transaction date is invalid' }, { status: 400 });
    }

    await connectToDatabase();
    const transaction = await Transaction.create({ userId: user.id, title, amount, type, category, date });
    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: 'Failed to create transaction' }, { status: 400 });
  }
}
