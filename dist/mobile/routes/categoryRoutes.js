"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const categoryService_1 = require("../../services/categoryService");
const router = (0, express_1.Router)();
/**
 * GET /api/categories
 * Publik / Terautentikasi: Mengambil daftar kategori aktif
 */
router.get('/', async (req, res) => {
    try {
        const type = req.query.type;
        const categories = await (0, categoryService_1.listCategories)(type);
        res.json({ success: true, data: categories });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil kategori.' });
    }
});
/**
 * POST /api/categories
 * Khusus Admin: Menambah data master kategori baru
 */
router.post('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    const { name, type, icon, color } = req.body;
    if (!name || !type || !['expense', 'income'].includes(type)) {
        res.status(400).json({
            success: false,
            message: 'Field "name" dan "type" (expense | income) wajib diisi.',
        });
        return;
    }
    try {
        const id = await (0, categoryService_1.createCategory)(authReq.userId, { name, type, icon, color });
        res.status(201).json({
            success: true,
            message: 'Kategori baru berhasil dibuat.',
            data: { id, name, type, icon, color },
        });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Gagal membuat kategori.' });
    }
});
/**
 * PUT /api/categories/:id
 * Khusus Admin: Mengubah data master kategori
 */
router.put('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    const id = Number(req.params.id);
    const { name, type, icon, color, is_active } = req.body;
    try {
        const ok = await (0, categoryService_1.updateCategory)(authReq.userId, id, { name, type, icon, color, is_active });
        if (!ok) {
            res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
            return;
        }
        res.json({ success: true, message: 'Kategori berhasil diperbarui.' });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Gagal mengubah kategori.' });
    }
});
/**
 * DELETE /api/categories/:id
 * Khusus Admin: Menghapus (soft-delete) data master kategori
 */
router.delete('/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    const id = Number(req.params.id);
    try {
        const ok = await (0, categoryService_1.deleteCategory)(authReq.userId, id);
        if (!ok) {
            res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
            return;
        }
        res.json({ success: true, message: 'Kategori berhasil dinonaktifkan.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
    }
});
exports.default = router;
