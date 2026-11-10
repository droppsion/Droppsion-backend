import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  syncProductStock,
  syncAllInventory,
  getCatalogMargins,
} from '../controllers/dropshipController';
import {
  validateSupplierId,
  validateCreateSupplier,
  validateUpdateSupplier,
  validateToggleSupplierStatus,
} from '../middleware/dropshipValidators';
import { validateProductId } from '../middleware/productValidators';

const router = Router();

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', validateCreateSupplier, createSupplier);
router.put('/suppliers/:id', validateSupplierId, validateUpdateSupplier, updateSupplier);
router.delete('/suppliers/:id', validateSupplierId, deleteSupplier);
router.patch('/suppliers/:id/status', validateSupplierId, validateToggleSupplierStatus, toggleSupplierStatus);

// Inventory Synchronization
router.get('/margins', getCatalogMargins);
router.post('/sync-all', syncAllInventory);
router.post('/sync/:productId', validateProductId, syncProductStock);

export default router;
