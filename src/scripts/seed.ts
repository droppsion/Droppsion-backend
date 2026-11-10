import { connectDatabase, seedDatabase } from '../config/db';
import mongoose from 'mongoose';

const run = async () => {
  console.log('🚀 Running manual MongoDB seeder script...');
  const connected = await connectDatabase();
  if (!connected) {
    console.error('❌ Could not connect to MongoDB. Please ensure your MONGODB_URI in backend/.env is valid.');
    process.exit(1);
  }

  console.log('Seeding products, suppliers, coupons, and reviews...');
  await seedDatabase();
  console.log('✅ Seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seeder script failed:', err);
  process.exit(1);
});

