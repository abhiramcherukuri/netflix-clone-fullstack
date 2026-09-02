import { Schema, model, type Types } from 'mongoose';

// 1. TypeScript Interface for the User Document
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  subscription: {
    plan: 'none' | 'basic' | 'standard' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    startDate: Date;
    endDate?: Date;
    stripeId?: string;
  };
  profiles: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// 2. Embedded Schema for Subscription Status
const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ['none', 'basic', 'standard', 'premium'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'inactive',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    stripeId: {
      type: String,
    },
  },
  { _id: false }, // No separate _id needed for embedded sub-document
);

// 3. Main User Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        plan: 'none',
        status: 'inactive',
      }),
    },
    profiles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    versionKey: false, // Disables the __v field
  },
);

// 4. Export Mongoose Model
export const UserModel = model<IUser>('User', userSchema);
