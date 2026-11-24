"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const dashboardService_1 = require("../../services/dashboardService");
const router = (0, express_1.Router)();
/**
 * GET /api/dashboard/web
 * Khusus Web Admin: Analitik menyeluruh sistem UKu
 */
router.get('/web', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (_req, res) => {
    try {
        const data = await (0, dashboardService_1.getWebDashboardData)();
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard web.' });
    }
});
/**
 * GET /api/dashboard
 * Untuk Mobile App (Pengguna Akhir)
 */
router.get('/', authMiddleware_1.requireAuth, async (req, res) => {
    const authReq = req;
    const userId = authReq.userId;
    try {
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const [budgetRows] = await db_1.default.query('SELECT amount FROM mobile_budgets WHERE user_id = ? AND month_start = ? LIMIT 1', [userId, monthStart]);
        const budget = Number(budgetRows[0]?.amount ?? 0);
        const [expenseRows] = await db_1.default.query(`SELECT COALESCE(SUM(amount), 0) AS total
       FROM mobile_transactions
       WHERE user_id = ? AND transaction_type = 'expense'
         AND transaction_date >= ? AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)`, [userId, monthStart, monthStart]);
        const expense = Number(expenseRows[0]?.total ?? 0);
        const [savingsRows] = await db_1.default.query('SELECT COALESCE(SUM(current_amount), 0) AS total FROM mobile_savings WHERE user_id = ?', [userId]);
        const savings = Number(savingsRows[0]?.total ?? 0);
        const [recentRows] = await db_1.default.query(`SELECT id, saving_id, transaction_type, category, amount, transaction_date, location, purpose, method
       FROM mobile_transactions
       WHERE user_id = ?
       ORDER BY transaction_date DESC, id DESC
       LIMIT 5`, [userId]);
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memuat dashboard mobile.' });
    }
});
exports.default = router;
