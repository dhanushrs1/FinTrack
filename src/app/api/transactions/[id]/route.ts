import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth';
import Transaction from '@/models/Transaction';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid transaction id' }, { status: 400 });
    }

    await connectToDatabase();
    
    const deletedTransaction = await Transaction.findOneAndDelete({ _id: id, userId: user.id });
    
    if (!deletedTransaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to delete transaction' }, { status: 400 });
  }
}
