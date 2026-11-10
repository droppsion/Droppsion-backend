import mongoose, { Schema, Document } from 'mongoose';
import { Review as IReview } from '../types';

export interface IReviewDocument extends Omit<IReview, 'id'>, Document {
  id: string;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    verifiedBuyer: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
    variantPurchased: { type: String },
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

export const ReviewModel = mongoose.model<IReviewDocument>('Review', ReviewSchema);

