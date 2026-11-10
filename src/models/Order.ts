import mongoose, { Schema, Document } from 'mongoose';
import { Order as IOrder } from '../types';

export interface IOrderDocument extends Omit<IOrder, 'id'>, Document {
  id: string;
}

const ShippingAddressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  variant: {
    id: { type: String },
    name: { type: String },
  },
}, { _id: false });

const MilestoneSchema = new Schema({
  status: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    trackingNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'],
      default: 'confirmed',
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, required: true },
    },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingMethod: { type: String, default: 'Standard Tracked Shipping' },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    carrier: { type: String, default: 'DHL Express' },
    estimatedDeliveryDate: { type: String },
    fulfillmentMilestones: [MilestoneSchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
