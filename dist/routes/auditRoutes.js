"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET /api/audit-logs
 * Khusus Web Admin: Melihat jejak audit aktivitas sistem
 */
router.get('/', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const [rows] = await db_1.default.query(`
      SELECT a.id, a.user_id, u.nama as userName, u.email as userEmail,
             a.action, a.resource, a.resource_id, a.details, a.ip_address, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC
      LIMIT ?
    `, [limit]);
        res.json({ success: true, data: rows });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memuat audit log.' });
    }
});
exports.default = router;
