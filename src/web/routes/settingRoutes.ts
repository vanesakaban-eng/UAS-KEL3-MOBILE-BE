import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  getRolesAndAccess,
  updateAdminJabatan,
  createAdmin,
  getSessions,
  terminateSession,
  logoutAll,
} from '../controllers/settingController';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint: GET & PUT /api/settings/profile
router.get('/profile', verifyToken, requireAdmin, getProfile);
router.put('/profile', verifyToken, requireAdmin, updateProfile);

// Endpoint: PUT /api/settings/password
router.put('/password', verifyToken, requireAdmin, updatePassword);

// Endpoint: GET /api/settings/roles & GET /api/settings/admins (Data Role & Akses khusus Admin)
router.get('/roles', verifyToken, requireAdmin, getRolesAndAccess);
router.get('/admins', verifyToken, requireAdmin, getRolesAndAccess);

// Endpoint: Role & Akses (Edit jabatan & tambah admin ber-role tunggal 'Admin')
router.put('/admins/:id', verifyToken, requireAdmin, updateAdminJabatan);
router.post('/admins', verifyToken, requireAdmin, createAdmin);

// Endpoint: Logout Sesi & Perangkat Aktif
router.get('/sessions', verifyToken, requireAdmin, getSessions);
router.delete('/session/:id', verifyToken, requireAdmin, terminateSession);
router.post('/logout-all', verifyToken, requireAdmin, logoutAll);

export default router;