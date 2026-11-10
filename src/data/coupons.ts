import { Coupon } from '../types/index.js';

export const COUPONS: Coupon[] = [
  {
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchaseAmount: 40,
    active: true,
  },
  {
    code: 'SUMMER20',
    discountType: 'percentage',
    discountValue: 20,
    minPurchaseAmount: 100,
    active: true,
  },
  {
    code: 'VIP50',
    discountType: 'fixed',
    discountValue: 50,
    minPurchaseAmount: 250,
    active: true,
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 0,
    minPurchaseAmount: 50,
    active: true,
  },
];

