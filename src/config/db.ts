import mongoose from 'mongoose';
import { config } from './index';
import { PRODUCTS } from '../data/products';
import { DROPSHIP_SUPPLIERS } from '../data/suppliers';
import { COUPONS } from '../data/coupons';
import { REVIEWS } from '../data/reviews';
import { ProductModel } from '../models/Product';
import { SupplierModel } from '../models/Supplier';
import { CouponModel } from '../models/Coupon';
import { ReviewModel } from '../models/Review';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  const uri = config.mongodbUri;

  // Detect unconfigured placeholder in URI
  if (uri.includes('<db_username>') || uri.includes('<password>')) {
    console.warn(
      '\n⚠️ [MongoDB] Notice: Your MONGODB_URI in backend/.env contains a placeholder (<db_username>).'
    );
    console.warn(
      '   Please update backend/.env with your real MongoDB Atlas credentials or use a local instance (e.g. mongodb://127.0.0.1:27017/droppsion).'
    );
    console.warn('   ⚡ Falling back to in-memory datasets so the API and Admin continue working smoothly.\n');
    return false;
  }

  try {
    console.log(`🔌 [MongoDB] Connecting to MongoDB: ${uri.replace(/:([^:@]+)@/, ':****@')}...`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    isConnected = true;
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    console.log(`✅ [MongoDB] Successfully connected to database "${dbName}" at ${host}`);

    // Automatically seed database if empty
    await autoSeedIfEmpty();

    return true;
  } catch (error: any) {
    console.warn(`\n⚠️ [MongoDB] Connection could not be established: ${error.message}`);
    console.warn('   ⚡ Falling back to in-memory datasets so the API and Admin continue working smoothly.\n');
    isConnected = false;
    return false;
  }
};

export const isDbConnected = (): boolean => isConnected;

export const getDbStatus = () => {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    databaseName: mongoose.connection.name || 'none',
    host: mongoose.connection.host || 'none',
  };
};

export const autoSeedIfEmpty = async () => {
  try {
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      console.log('🌱 [MongoDB] Database is empty. Seeding initial catalog, suppliers, coupons, and reviews...');
      await seedDatabase();
      console.log('✨ [MongoDB] Seed completed successfully!');
    } else {
      console.log(`📦 [MongoDB] Database already initialized with ${productCount} products.`);
    }
  } catch (err: any) {
    console.error('❌ [MongoDB] Error during auto-seeding:', err.message);
  }
};

export const seedDatabase = async () => {
  // Products
  await ProductModel.deleteMany({});
  await ProductModel.insertMany(PRODUCTS);

  // Suppliers
  await SupplierModel.deleteMany({});
  await SupplierModel.insertMany(DROPSHIP_SUPPLIERS);

  // Coupons
  await CouponModel.deleteMany({});
  await CouponModel.insertMany(COUPONS);

  // Reviews
  await ReviewModel.deleteMany({});
  await ReviewModel.insertMany(REVIEWS);
};
