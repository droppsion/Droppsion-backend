import { Request, Response } from 'express';
import { COUPONS } from '../data/coupons';
import { CouponModel } from '../models/Coupon';
import { isDbConnected } from '../config/db';

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();

    let coupon: any = null;
    if (isDbConnected()) {
      coupon = await CouponModel.findOne({ code: cleanCode, active: true }).lean();
    } else {
      coupon = COUPONS.find((c) => c.code === cleanCode && c.active);
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Promo code "${cleanCode}" is invalid or expired.`,
      });
    }

    const sub = parseFloat(subtotal);

    if (coupon.minPurchaseAmount && sub < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Promo code "${cleanCode}" requires a minimum order of $${coupon.minPurchaseAmount.toFixed(2)}.`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (sub * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (coupon.code === 'FREESHIP') {
      discountAmount = 0;
    }

    const finalSubtotal = Math.max(0, sub - discountAmount);

    return res.json({
      success: true,
      source: isDbConnected() ? 'mongodb' : 'memory',
      message: `Coupon "${cleanCode}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalSubtotal: parseFloat(finalSubtotal.toFixed(2)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate coupon', error });
  }
};

export const getPublicCoupons = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const activeCoupons = await CouponModel.find({ active: true }).lean();
      const publicList = activeCoupons.map(({ code, discountType, discountValue, minPurchaseAmount }) => ({
        code,
        discountType,
        discountValue,
        minPurchaseAmount,
        label:
          discountType === 'percentage'
            ? `${discountValue}% OFF orders over $${minPurchaseAmount || 0}`
            : `$${discountValue} OFF orders over $${minPurchaseAmount || 0}`,
      }));

      return res.json({ success: true, source: 'mongodb', coupons: publicList });
    }

    const publicList = COUPONS.filter((c) => c.active).map(({ code, discountType, discountValue, minPurchaseAmount }) => ({
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      label:
        discountType === 'percentage'
          ? `${discountValue}% OFF orders over $${minPurchaseAmount || 0}`
          : `$${discountValue} OFF orders over $${minPurchaseAmount || 0}`,
    }));

    return res.json({ success: true, source: 'memory', coupons: publicList });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons', error });
  }
};

export const getAllCoupons = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, source: 'mongodb', coupons });
    }

    return res.json({ success: true, source: 'memory', coupons: COUPONS });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all coupons', error });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minPurchaseAmount, expiresAt, active = true } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'code, discountType, and discountValue are required' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (isDbConnected()) {
      const created = await CouponModel.create({
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        minPurchaseAmount: Number(minPurchaseAmount) || 0,
        expiresAt,
        active,
      });

      return res.status(201).json({ success: true, source: 'mongodb', coupon: created });
    }

    const newCoupon = {
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      expiresAt,
      active,
    };
    COUPONS.unshift(newCoupon);

    return res.status(201).json({ success: true, source: 'memory', coupon: newCoupon });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.code;
    const cleanCode = code.trim().toUpperCase();

    if (isDbConnected()) {
      const updated = await CouponModel.findOneAndUpdate(
        { code: cleanCode },
        { $set: updates },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', coupon: updated });
    }

    const index = COUPONS.findIndex((c) => c.code === cleanCode);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
    }

    COUPONS[index] = { ...COUPONS[index], ...updates };
    return res.json({ success: true, source: 'memory', coupon: COUPONS[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update coupon', error: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    if (isDbConnected()) {
      const deleted = await CouponModel.findOneAndDelete({ code: cleanCode });
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', message: `Coupon '${cleanCode}' deleted successfully` });
    }

    const initialLength = COUPONS.length;
    const filtered = COUPONS.filter((c) => c.code !== cleanCode);
    if (filtered.length === initialLength) {
      return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
    }

    COUPONS.length = 0;
    COUPONS.push(...filtered);

    return res.json({ success: true, source: 'memory', message: `Coupon '${cleanCode}' deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
  }
};

export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    if (isDbConnected()) {
      const coupon = await CouponModel.findOne({ code: cleanCode });
      if (!coupon) {
        return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
      }

      coupon.active = !coupon.active;
      await coupon.save();

      return res.json({
        success: true,
        source: 'mongodb',
        message: `Coupon '${cleanCode}' is now ${coupon.active ? 'Active' : 'Disabled'}`,
        coupon,
      });
    }

    const coupon = COUPONS.find((c) => c.code === cleanCode);
    if (!coupon) {
      return res.status(404).json({ success: false, message: `Coupon '${cleanCode}' not found` });
    }

    coupon.active = !coupon.active;
    return res.json({
      success: true,
      source: 'memory',
      message: `Coupon '${cleanCode}' is now ${coupon.active ? 'Active' : 'Disabled'}`,
      coupon,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle coupon status', error: error.message });
  }
};