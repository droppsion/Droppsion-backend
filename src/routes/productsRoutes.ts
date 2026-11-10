import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getCategories,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from '../controllers/productsController';
import {
  validateProductId,
  validateProductSlug,
  validateCreateProduct,
  validateUpdateProduct,
  validateToggleProductStatus,
} from '../middleware/productValidators';

const router = Router();

// Public Catalog Queries
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/id/:id', validateProductId, getProductById);
router.get('/:slug', validateProductSlug, getProductBySlug);

// Management & Mutations (Create, Update, Delete, Status)
router.post('/', validateCreateProduct, createProduct);
router.put('/:id', validateProductId, validateUpdateProduct, updateProduct);
router.delete('/:id', validateProductId, deleteProduct);
router.patch('/:id/status', validateProductId, validateToggleProductStatus, toggleProductStatus);

export default router;
