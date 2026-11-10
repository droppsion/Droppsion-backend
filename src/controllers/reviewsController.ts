import { Request, Response } from 'express';
import { REVIEWS } from '../data/reviews';
import { Review } from '../types/index';
import { ReviewModel } from '../models/Review';
import { isDbConnected } from '../config/db';

const LOCAL_REVIEWS: Review[] = [...REVIEWS];

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (isDbConnected()) {
      const reviews = await ReviewModel.find({ productId }).sort({ createdAt: -1 }).lean();
      const averageRating =
        reviews.length > 0
          ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
          : 5.0;

      return res.json({
        success: true,
        source: 'mongodb',
        productId,
        totalReviews: reviews.length,
        averageRating,
        reviews,
      });
    }

    const productReviews = LOCAL_REVIEWS.filter((r) => r.productId === productId);
    const averageRating =
      productReviews.length > 0
        ? parseFloat((productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1))
        : 5.0;

    return res.json({
      success: true,
      source: 'memory',
      productId,
      totalReviews: productReviews.length,
      averageRating,
      reviews: productReviews,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error });
  }
};

export const createReview = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { author, rating, title, comment, variantPurchased } = req.body;

    if (!author || !comment || !rating) {
      return res.status(400).json({ success: false, message: 'Author, rating, and comment are required' });
    }

    const newReviewData: Review = {
      id: `rev-${Date.now()}`,
      productId,
      author,
      rating: parseInt(rating, 10) || 5,
      date: new Date().toISOString().split('T')[0],
      title: title || 'Quality Verified Purchase',
      comment,
      verifiedBuyer: true,
      helpfulCount: 0,
      variantPurchased,
    };

    if (isDbConnected()) {
      const created = await ReviewModel.create(newReviewData);
      return res.status(201).json({
        success: true,
        source: 'mongodb',
        message: 'Review submitted successfully to MongoDB',
        review: created,
      });
    }

    LOCAL_REVIEWS.unshift(newReviewData);

    return res.status(201).json({
      success: true,
      source: 'memory',
      message: 'Review submitted successfully',
      review: newReviewData,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
};
