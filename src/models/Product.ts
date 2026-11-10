import mongoose, { Schema, Document } from 'mongoose';
import { Product as IProduct } from '../types';

export interface IProductDocument extends Omit<IProduct, 'id'>, Document {
  id: string;
}

const ProductVariantSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['color', 'size', 'material'], required: true },
  value: { type: String, required: true },
  inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  priceModifier: { type: Number, default: 0 },
  imageIndex: { type: Number, default: 0 },
  supplierSku: { type: String },
}, { _id: false });

const DropshipDetailsSchema = new Schema({
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  supplierSku: { type: String, required: true },
  supplierCost: { type: Number, required: true },
  marginPercentage: { type: Number, required: true },
  markupMultiplier: { type: Number, required: true },
  fulfillmentCenter: { type: String, required: true },
  countryOfOrigin: { type: String, required: true },
  leadTimeHours: { type: Number, required: true },
  estimatedTransitDays: { type: String, required: true },
  shippingCarriers: [{ type: String }],
  stockSyncedAt: { type: String, required: true },
  syncStatus: { type: String, enum: ['active', 'syncing', 'delayed'], default: 'active' },
}, { _id: false });

const ProductDetailsSchema = new Schema({
  materials: [{ type: String }],
  dimensions: { type: String },
  weight: { type: String },
  origin: { type: String },
  careInstructions: [{ type: String }],
}, { _id: false });

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, required: true },
    editorialStory: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    category: { type: String, required: true, index: true },
    categoryLabel: { type: String, required: true },
    tags: [{ type: String, index: true }],
    rating: { type: Number, default: 5 },
    reviewCount: { type: Number, default: 0 },
    badge: { type: String, enum: ['NEW', 'SALE', 'BESTSELLER'] },
    inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 50 },
    estimatedDelivery: { type: String, default: '2-4 business days' },
    images: [{ type: String }],
    variants: [ProductVariantSchema],
    details: ProductDetailsSchema,
    features: [{ type: String }],
    dropship: DropshipDetailsSchema,
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

export const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);

