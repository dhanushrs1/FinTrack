import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user'],
      index: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      maxlength: [50, 'Title cannot be more than 50 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
    },
    type: {
      type: String,
      required: [true, 'Please specify if this is an income or expense'],
      enum: ['income', 'expense'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date'],
      default: Date.now,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });

// Prevent mongoose from creating the model multiple times during API route hot-reloading
const Transaction: Model<ITransaction> = 
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
