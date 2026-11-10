import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  jwtSecret: process.env.JWT_SECRET || 'droppsion-secret-dropship-key-2026',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/droppsion',
};
