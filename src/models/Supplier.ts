import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierDocument extends Document {
  id: string;
  name: string;
  region: string;
  contactPerson: string;
  apiProtocol: string;
  performanceRating: number;
  averageFulfillmentHours: number;
  onTimeRate: number;
  defectRate: number;
  status: 'connected' | 'offline' | 'syncing' | 'deactivated';
  activeSkusCount: number;
  totalOrdersFulfilled: number;
  autoFulfillEnabled: boolean;
  currency: string;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    region: { type: String, required: true },
    contactPerson: { type: String, default: 'Operations Lead' },
    apiProtocol: {
      type: String,
      default: 'REST-EDI (v3.2)',
    },
    performanceRating: { type: Number, default: 4.8 },
    averageFulfillmentHours: { type: Number, default: 24 },
    onTimeRate: { type: Number, default: 98.0 },
    defectRate: { type: Number, default: 0.2 },
    status: {
      type: String,
      enum: ['connected', 'offline', 'syncing', 'deactivated'],
      default: 'connected',
    },
    activeSkusCount: { type: Number, default: 10 },
    totalOrdersFulfilled: { type: Number, default: 0 },
    autoFulfillEnabled: { type: Boolean, default: true },
    currency: { type: String, default: 'USD' },
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

export const SupplierModel = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);