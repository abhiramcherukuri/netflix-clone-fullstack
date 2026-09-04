import { Schema, model, type Types } from 'mongoose';
import {
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  type UserRole,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from './users.constants.ts';

// 1. TypeScript Interface for the User Document
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
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
      enum: Object.values(SUBSCRIPTION_PLANS),
      default: SUBSCRIPTION_PLANS.NONE,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.INACTIVE,
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
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({
        plan: SUBSCRIPTION_PLANS.NONE,
        status: SUBSCRIPTION_STATUS.INACTIVE,
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
