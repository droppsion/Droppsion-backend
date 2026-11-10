import { Router } from 'express';
import {
  validateCoupon,
  getPublicCoupons,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from '../controllers/couponsController';
import {
  validateCouponCode,
  validateCreateCoupon,
  validateUpdateCoupon,
} from '../middleware/couponValidators';

const router = Router();

router.get('/', getPublicCoupons);
router.get('/all', getAllCoupons);
router.post('/validate', validateCoupon);

// Management & Mutations (Create, Update, Delete, Status)
router.post('/', validateCreateCoupon, createCoupon);
router.put('/:code', validateCouponCode, validateUpdateCoupon, updateCoupon);
router.delete('/:code', validateCouponCode, deleteCoupon);
router.patch('/:code/status', validateCouponCode, toggleCouponStatus);

export default router;
