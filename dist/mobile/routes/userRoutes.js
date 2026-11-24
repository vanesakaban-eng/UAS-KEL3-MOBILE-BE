"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const userService_1 = require("../../services/userService");
const router = (0, express_1.Router)();
/**
 * GET /api/users
 * Khusus Web Admin: Daftar semua pengguna
 */
router.get('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    try {
        const users = await (0, userService_1.listAllUsers)(authReq.userId);
        res.json({ success: true, data: users });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengguna.' });
    }
});
/**
 * GET /api/users/:id
 * Admin atau Pengguna sendiri
 */
router.get('/:id', authMiddleware_1.requireAuth, async (req, res) => {
    const authReq = req;
    const targetId = Number(req.params.id);
    if (authReq.userRole !== 'admin' && authReq.userId !== targetId) {
        res.status(403).json({ success: false, message: 'Akses ditolak.' });
        return;
    }
    try {
        const user = await (0, userService_1.getUserById)(targetId);
        if (!user) {
            res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil detail pengguna.' });
    }
});
/**
 * PUT /api/users/:id/role
 * Khusus Web Admin: Mengubah role pengguna (admin <-> user)
 */
router.put('/:id/role', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    const targetId = Number(req.params.id);
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
        res.status(400).json({ success: false, message: 'Role harus berupa "admin" atau "user".' });
        return;
    }
    try {
        const ok = await (0, userService_1.updateUserRole)(authReq.userId, targetId, role);
        if (!ok) {
            res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
            return;
        }
        res.json({ success: true, message: `Role pengguna berhasil diubah menjadi ${role}.` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengubah role pengguna.' });
    }
});
exports.default = router;
