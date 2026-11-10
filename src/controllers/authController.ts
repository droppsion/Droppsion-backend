import { Request, Response } from 'express';
import { AdminUserModel } from '../models/AdminUser';
import { isDbConnected } from '../config/db';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
  token: string;
}

const DEMO_USER: UserSession = {
  id: 'usr-98124',
  name: 'Marcus Vance',
  email: 'marcus.vance@example.com',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  token: 'mock-jwt-token-novatrend-user-session',
};

const DEFAULT_ADMIN_STAFF = [
  {
    id: 'usr_super_01',
    name: 'Super Admin',
    email: 'admin@novatrend.com',
    role: 'super_admin',
    avatar: 'SA',
    status: 'active',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr_director_02',
    name: 'Store Director',
    email: 'director@novatrend.com',
    role: 'store_manager',
    avatar: 'SD',
    status: 'active',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr_ops_03',
    name: 'Logistics Operator',
    email: 'ops@novatrend.com',
    role: 'logistics_operator',
    avatar: 'LO',
    status: 'active',
    lastLogin: new Date().toISOString(),
  },
];

export const login = (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = {
      ...DEMO_USER,
      email: email.toLowerCase(),
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
    };

    return res.json({
      success: true,
      message: 'Login successful',
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error });
  }
};

export const register = (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const newUser: UserSession = {
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      token: `mock-jwt-token-${Date.now()}`,
    };

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Registration failed', error });
  }
};

export const getMe = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Missing token.' });
  }

  return res.json({
    success: true,
    user: DEMO_USER,
  });
};

// ==========================================
// ADMIN AUTHENTICATION & TEAM MANAGEMENT
// ==========================================

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check DB first if connected
    if (isDbConnected()) {
      const dbAdmin = await AdminUserModel.findOne({ email: cleanEmail });
      if (dbAdmin) {
        if (dbAdmin.status === 'deactivated') {
          return res.status(403).json({ success: false, message: 'This admin account has been deactivated.' });
        }
        dbAdmin.lastLogin = new Date().toISOString();
        await dbAdmin.save();

        return res.json({
          success: true,
          message: 'Admin authentication successful',
          token: `token-admin-session-${Date.now()}`,
          user: {
            id: dbAdmin.id,
            name: dbAdmin.name,
            email: dbAdmin.email,
            role: dbAdmin.role,
            avatar: dbAdmin.avatar || dbAdmin.name.slice(0, 2).toUpperCase(),
            lastLogin: dbAdmin.lastLogin,
          },
        });
      }
    }

    // Predefined accounts or valid administrative fallback
    const matched = DEFAULT_ADMIN_STAFF.find((a) => a.email === cleanEmail);
    if (matched) {
      return res.json({
        success: true,
        message: 'Admin authentication successful',
        token: `token-admin-session-${Date.now()}`,
        user: {
          ...matched,
          lastLogin: new Date().toISOString(),
        },
      });
    }

    if (cleanEmail.includes('@') && password.length >= 4) {
      const fallbackUser = {
        id: `usr_${Date.now()}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: cleanEmail,
        role: 'super_admin' as const,
        avatar: cleanEmail.slice(0, 2).toUpperCase(),
        status: 'active' as const,
        lastLogin: new Date().toISOString(),
      };

      return res.json({
        success: true,
        message: 'Admin authentication successful',
        token: `token-admin-session-${Date.now()}`,
        user: fallbackUser,
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Admin login failed', error: error.message });
  }
};

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    if (isDbConnected()) {
      const users = await AdminUserModel.find().lean();
      if (users.length > 0) {
        return res.json({ success: true, source: 'mongodb', users });
      }
    }
    return res.json({ success: true, source: 'memory', users: DEFAULT_ADMIN_STAFF });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin users', error: error.message });
  }
};

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role = 'store_manager' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const newUser = {
      id: `usr_staff_${Date.now().toString().slice(-4)}`,
      name,
      email: cleanEmail,
      role,
      avatar: name.slice(0, 2).toUpperCase(),
      status: 'active' as const,
      lastLogin: new Date().toISOString(),
    };

    if (isDbConnected()) {
      const created = await AdminUserModel.create(newUser);
      return res.status(201).json({ success: true, source: 'mongodb', user: created });
    }

    DEFAULT_ADMIN_STAFF.unshift(newUser);
    return res.status(201).json({ success: true, source: 'memory', user: newUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create admin user', error: error.message });
  }
};

export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected()) {
      const updated = await AdminUserModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
      }

      return res.json({ success: true, source: 'mongodb', user: updated });
    }

    const index = DEFAULT_ADMIN_STAFF.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
    }

    DEFAULT_ADMIN_STAFF[index] = { ...DEFAULT_ADMIN_STAFF[index], ...updates };
    return res.json({ success: true, source: 'memory', user: DEFAULT_ADMIN_STAFF[index] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update admin user', error: error.message });
  }
};

export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const deleted = await AdminUserModel.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
      }
      return res.json({ success: true, source: 'mongodb', message: `Admin user '${id}' deleted` });
    }

    const initial = DEFAULT_ADMIN_STAFF.length;
    const filtered = DEFAULT_ADMIN_STAFF.filter((u) => u.id !== id);
    if (filtered.length === initial) {
      return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
    }

    DEFAULT_ADMIN_STAFF.length = 0;
    DEFAULT_ADMIN_STAFF.push(...filtered);

    return res.json({ success: true, source: 'memory', message: `Admin user '${id}' deleted` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete admin user', error: error.message });
  }
};

export const toggleAdminUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const user = await AdminUserModel.findOne({ id });
      if (!user) {
        return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
      }
      user.status = user.status === 'active' ? 'deactivated' : 'active';
      await user.save();

      return res.json({
        success: true,
        source: 'mongodb',
        message: `Admin user status updated to ${user.status}`,
        user,
      });
    }

    const user = DEFAULT_ADMIN_STAFF.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: `Admin user '${id}' not found` });
    }

    user.status = user.status === 'active' ? 'deactivated' : 'active';
    return res.json({
      success: true,
      source: 'memory',
      message: `Admin user status updated to ${user.status}`,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle admin status', error: error.message });
  }
};