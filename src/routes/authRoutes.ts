import { Router } from 'express';
import {
  login,
  register,
  getMe,
  adminLogin,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  toggleAdminUserStatus,
} from '../controllers/authController';
import {
  validateAdminLogin,
  validateAdminUserId,
  validateCreateAdminUser,
  validateUpdateAdminUser,
  validateCustomerLogin,
  validateCustomerRegister,
} from '../middleware/authValidators';

const router = Router();

// Customer Authentication
router.post('/login', validateCustomerLogin, login);
router.post('/register', validateCustomerRegister, register);
router.get('/me', getMe);

// Admin Console Auth & Staff Management
router.post('/admin/login', validateAdminLogin, adminLogin);
router.get('/admin/users', getAdminUsers);
router.post('/admin/users', validateCreateAdminUser, createAdminUser);
router.put('/admin/users/:id', validateAdminUserId, validateUpdateAdminUser, updateAdminUser);
router.delete('/admin/users/:id', validateAdminUserId, deleteAdminUser);
router.patch('/admin/users/:id/status', validateAdminUserId, toggleAdminUserStatus);

export default router;
