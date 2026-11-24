import { Router } from 'express';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/authMiddleware';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../../services/categoryService';

const router = Router();

/**
 * GET /api/categories
 * Publik / Terautentikasi: Mengambil daftar kategori aktif
 */
router.get('/', async (req, res) => {
  try {
    const type = req.query.type as 'expense' | 'income' | undefined;
    const categories = await listCategories(type);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil kategori.' });
  }
});

/**
 * POST /api/categories
 * Khusus Admin: Menambah data master kategori baru
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { name, type, icon, color } = req.body;

  if (!name || !type || !['expense', 'income'].includes(type)) {
    res.status(400).json({
      success: false,
      message: 'Field "name" dan "type" (expense | income) wajib diisi.',
    });
    return;
  }

  try {
    const id = await createCategory(authReq.userId, { name, type, icon, color });
    res.status(201).json({
      success: true,
      message: 'Kategori baru berhasil dibuat.',
      data: { id, name, type, icon, color },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Gagal membuat kategori.' });
  }
});

/**
 * PUT /api/categories/:id
 * Khusus Admin: Mengubah data master kategori
 */
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const id = Number(req.params.id);
  const { name, type, icon, color, is_active } = req.body;

  try {
    const ok = await updateCategory(authReq.userId, id, { name, type, icon, color, is_active });
    if (!ok) {
      res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
      return;
    }
    res.json({ success: true, message: 'Kategori berhasil diperbarui.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Gagal mengubah kategori.' });
  }
});

/**
 * DELETE /api/categories/:id
 * Khusus Admin: Menghapus (soft-delete) data master kategori
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const id = Number(req.params.id);

  try {
    const ok = await deleteCategory(authReq.userId, id);
    if (!ok) {
      res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
      return;
    }
    res.json({ success: true, message: 'Kategori berhasil dinonaktifkan.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
  }
});

export default router;
