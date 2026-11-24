import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/audit-logs
 * Khusus Web Admin: Melihat jejak audit aktivitas sistem
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const [rows] = await db.query<RowDataPacket[]>(`
      SELECT a.id, a.user_id, u.nama as userName, u.email as userEmail,
             a.action, a.resource, a.resource_id, a.details, a.ip_address, a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.id DESC
      LIMIT ?
    `, [limit]);

    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat audit log.' });
  }
});

export default router;
