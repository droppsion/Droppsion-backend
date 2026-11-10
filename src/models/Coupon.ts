import mongoose, { Schema, Document } from 'mongoose';
import { Coupon as ICoupon } from '../types';

export interface ICouponDocument extends ICoupon, Document {}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true },
    minPurchaseAmount: { type: Number, default: 0 },
    expiresAt: { type: String },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CouponModel = mongoose.model<ICouponDocument>('Coupon', CouponSchema);

