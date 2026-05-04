import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  vaultKeyHash: string;
  vaultKeySalt: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, 'Email cannot be more than 120 characters'],
    },
    vaultKeyHash: {
      type: String,
      required: true,
    },
    vaultKeySalt: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      required: true,
      default: '#4f46e5',
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
