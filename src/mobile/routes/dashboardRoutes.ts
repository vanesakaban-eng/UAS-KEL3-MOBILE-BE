import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/authMiddleware';
import { getWebDashboardData } from '../../services/dashboardService';

const router = Router();

/**
 * GET /api/dashboard/web
 * Khusus Web Admin: Analitik menyeluruh sistem UKu
 */
router.get('/web', requireAuth, requireRole('admin'), async (_req, res) => {
  try {
    const data = await getWebDashboardData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard web.' });
  }
});

/**
 * GET /api/dashboard
 * Untuk Mobile App (Pengguna Akhir)
 */
router.get('/', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId;

  try {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [budgetRows] = await db.query<RowDataPacket[]>(
      'SELECT amount FROM mobile_budgets WHERE user_id = ? AND month_start = ? LIMIT 1',
      [userId, monthStart],
    );
    const budget = Number(budgetRows[0]?.amount ?? 0);

    const [expenseRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM mobile_transactions
       WHERE user_id = ? AND transaction_type = 'expense'
         AND transaction_date >= ? AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)`,
      [userId, monthStart, monthStart],
    );
    const expense = Number(expenseRows[0]?.total ?? 0);

    const [savingsRows] = await db.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(current_amount), 0) AS total FROM mobile_savings WHERE user_id = ?',
      [userId],
    );
    const savings = Number(savingsRows[0]?.total ?? 0);

    const [recentRows] = await db.query<RowDataPacket[]>(
      `SELECT id, saving_id, transaction_type, category, amount, transaction_date, location, purpose, method
       FROM mobile_transactions
       WHERE user_id = ?
       ORDER BY transaction_date DESC, id DESC
       LIMIT 5`,
      [userId],
    );

    res.json({
      success: true,
      data: {
        budget,
        totalExpense: expense,
        totalSavings: savings,
        remainingBudget: budget - expense,
        recentTransactions: recentRows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat dashboard mobile.' });
  }
});

export default router;
