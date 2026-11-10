import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/reviewsController.js';

const router = Router();

router.get('/:productId', getProductReviews);
router.post('/:productId', createReview);

export default router;

