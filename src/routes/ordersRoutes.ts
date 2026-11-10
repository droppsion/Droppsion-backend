import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/ordersController';
import {
  validateOrderId,
  validateCreateOrder,
  validateUpdateOrderStatus,
} from '../middleware/orderValidators';

const router = Router();

router.get('/', getOrders);
router.get('/track/:trackingNumber', trackOrder);
router.get('/:id', validateOrderId, getOrderById);

// Order Mutations (Create, Update Status, Delete)
router.post('/', validateCreateOrder, createOrder);
router.patch('/:id/status', validateOrderId, validateUpdateOrderStatus, updateOrderStatus);
router.delete('/:id', validateOrderId, deleteOrder);

export default router;
