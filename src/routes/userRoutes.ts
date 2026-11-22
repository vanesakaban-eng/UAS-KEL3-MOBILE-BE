import { Router } from 'express';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/authMiddleware';
import { getUserById, listAllUsers, updateUserRole } from '../services/userService';

const router = Router();

/**
 * GET /api/users
 * Khusus Web Admin: Daftar semua pengguna
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const users = await listAllUsers(authReq.userId);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengguna.' });
  }
});

/**
 * GET /api/users/:id
 * Admin atau Pengguna sendiri
 */
router.get('/:id', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const targetId = Number(req.params.id);

  if (authReq.userRole !== 'admin' && authReq.userId !== targetId) {
    res.status(403).json({ success: false, message: 'Akses ditolak.' });
    return;
  }

  try {
    const user = await getUserById(targetId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pengguna.' });
  }
});

/**
 * PUT /api/users/:id/role
 * Khusus Web Admin: Mengubah role pengguna (admin <-> user)
 */
router.put('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const targetId = Number(req.params.id);
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    res.status(400).json({ success: false, message: 'Role harus berupa "admin" atau "user".' });
    return;
  }

  try {
    const ok = await updateUserRole(authReq.userId, targetId, role);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }
    res.json({ success: true, message: `Role pengguna berhasil diubah menjadi ${role}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengubah role pengguna.' });
  }
});

export default router;
