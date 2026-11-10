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

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', getMe);

// Admin Console Auth & Staff Management
router.post('/admin/login', adminLogin);
router.get('/admin/users', getAdminUsers);
router.post('/admin/users', createAdminUser);
router.put('/admin/users/:id', updateAdminUser);
router.delete('/admin/users/:id', deleteAdminUser);
router.patch('/admin/users/:id/status', toggleAdminUserStatus);

export default router;