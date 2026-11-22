"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../config/db"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const aiService_1 = require("../services/ai/aiService");
const router = (0, express_1.Router)();
/**
 * POST /api/ai/analyze
 * Endpoint untuk meminta analisis / insight AI (Role, Constraint, Output Schema)
 * Dapat dipanggil oleh Mobile App maupun Web.
 */
router.post('/analyze', authMiddleware_1.requireAuth, async (req, res) => {
    const authReq = req;
    const { input, promptType } = req.body;
    if (typeof input !== 'string' || !input.trim()) {
        res.status(400).json({
            success: false,
            message: 'Parameter "input" bertipe string wajib diisi.',
        });
        return;
    }
    try {
        const result = await (0, aiService_1.generateFinancialInsight)(authReq.userId, input.trim(), promptType || 'financial_insight');
        res.json({
            success: true,
            message: 'Analisis AI berhasil diproses.',
            data: result,
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Gagal memproses analisis AI.',
        });
    }
});
/**
 * GET /api/ai/history
 * Mengambil riwayat rekomendasi AI milik pengguna yang sedang login.
 */
router.get('/history', authMiddleware_1.requireAuth, async (req, res) => {
    const authReq = req;
    try {
        const [rows] = await db_1.default.query(`SELECT id, prompt_type, raw_input, ai_output_json, verification_status, verification_note, created_at, verified_at
       FROM ai_results
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 20`, [authReq.userId]);
        const history = rows.map((r) => ({
            id: r.id,
            promptType: r.prompt_type,
            rawInput: r.raw_input,
            output: typeof r.ai_output_json === 'string' ? JSON.parse(r.ai_output_json) : r.ai_output_json,
            verificationStatus: r.verification_status,
            verificationNote: r.verification_note,
            createdAt: r.created_at,
            verifiedAt: r.verified_at,
        }));
        res.json({ success: true, data: history });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat AI.' });
    }
});
/**
 * GET /api/ai/pending
 * KHUSUS ADMIN (Web Admin): Mengambil daftar hasil AI yang memerlukan verifikasi manual.
 */
router.get('/pending', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (_req, res) => {
    try {
        const [rows] = await db_1.default.query(`
      SELECT a.id, a.user_id, u.nama as userName, u.email as userEmail,
             a.prompt_type, a.raw_input, a.sanitized_input, a.ai_output_json,
             a.verification_status, a.created_at
      FROM ai_results a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.verification_status = 'pending'
      ORDER BY a.id DESC
    `);
        const pendingList = rows.map((r) => ({
            id: r.id,
            userId: r.user_id,
            userName: r.userName || 'Pengguna',
            userEmail: r.userEmail || '',
            promptType: r.prompt_type,
            rawInput: r.raw_input,
            sanitizedInput: r.sanitized_input,
            aiOutput: typeof r.ai_output_json === 'string' ? JSON.parse(r.ai_output_json) : r.ai_output_json,
            status: r.verification_status,
            createdAt: r.created_at,
        }));
        res.json({ success: true, data: pendingList });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar verifikasi AI.' });
    }
});
/**
 * PUT /api/ai/:id/verify
 * KHUSUS ADMIN (Web Admin): Melakukan verifikasi manual (Approve / Reject) terhadap hasil AI.
 */
router.put('/:id/verify', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)('admin'), async (req, res) => {
    const authReq = req;
    const id = Number(req.params.id);
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({
            success: false,
            message: 'Status verifikasi harus "approved" atau "rejected".',
        });
        return;
    }
    try {
        const success = await (0, aiService_1.verifyAiResult)(id, authReq.userId, status, note);
        if (!success) {
            res.status(404).json({ success: false, message: 'Data hasil AI tidak ditemukan.' });
            return;
        }
        res.json({
            success: true,
            message: `Hasil AI berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}.`,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memverifikasi hasil AI.' });
    }
});
exports.default = router;
