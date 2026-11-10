import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'store_manager' | 'logistics_operator';
  avatar?: string;
  status: 'active' | 'deactivated';
  lastLogin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, default: 'admin123' },
    role: {
      type: String,
      enum: ['super_admin', 'store_manager', 'logistics_operator'],
      default: 'store_manager',
    },
    avatar: { type: String },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
    lastLogin: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

export const AdminUserModel = mongoose.model<IAdminUserDocument>('AdminUser', AdminUserSchema);