import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/reviewsController';
import {
  validateReviewProductId,
  validateCreateReview,
} from '../middleware/reviewValidators';

const router = Router();

router.get('/:productId', validateReviewProductId, getProductReviews);
router.post('/:productId', validateReviewProductId, validateCreateReview, createReview);

export default router;
