import { Router } from 'express';
import productsRoutes from './productsRoutes';
import ordersRoutes from './ordersRoutes';
import couponsRoutes from './couponsRoutes';
import dropshipRoutes from './dropshipRoutes';
import authRoutes from './authRoutes';
import reviewsRoutes from './reviewsRoutes';
import { getDbStatus, seedDatabase, isDbConnected } from '../config/db';

const router = Router();

// Mount API subrouters
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/coupons', couponsRoutes);
router.use('/dropship', dropshipRoutes);
router.use('/auth', authRoutes);
router.use('/reviews', reviewsRoutes);

// Database Health & Status
router.get('/db/status', (_req, res) => {
  const status = getDbStatus();
  res.json({
    success: true,
    database: 'MongoDB',
    ...status,
  });
});

// Trigger Database Seeding (Admin & Setup)
router.post('/db/seed', async (_req, res) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        message: 'MongoDB is not connected. Please check your MONGODB_URI in backend/.env',
      });
    }

    await seedDatabase();
    return res.json({
      success: true,
      message: 'MongoDB database successfully re-seeded with luxury catalog, suppliers, coupons, and reviews.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to seed MongoDB',
      error: error.message,
    });
  }
});

// Meta API Info
router.get('/', (_req, res) => {
  res.json({
    name: 'NovaTrend Dropshipping Engine API',
    version: '1.0.0',
    status: 'online',
    database: getDbStatus(),
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      coupons: '/api/coupons',
      dropship: '/api/dropship',
      auth: '/api/auth',
      reviews: '/api/reviews',
      dbStatus: '/api/db/status',
      dbSeed: '/api/db/seed (POST)',
    },
  });
});

export default router;
