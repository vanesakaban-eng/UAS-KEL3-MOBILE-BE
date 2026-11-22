"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : undefined;
    if (!token) {
        res.status(401).json({ success: false, message: 'Token autentikasi diperlukan.' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'uku_secret_key_2026_default');
        const userId = Number(payload.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(401).json({ success: false, message: 'Token autentikasi tidak valid.' });
            return;
        }
        const authReq = req;
        authReq.userId = userId;
        authReq.userEmail = String(payload.email || '');
        authReq.userRole = (String(payload.role || '').toLowerCase() === 'admin' ? 'admin' : 'user');
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Token autentikasi tidak valid atau kedaluwarsa.' });
    }
}
/**
 * Middleware Role-Based Access Control (RBAC)
 * Memastikan pengguna memiliki salah satu role yang diizinkan.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.userId) {
            res.status(401).json({ success: false, message: 'Pengguna belum terautentikasi.' });
            return;
        }
        if (!allowedRoles.includes(authReq.userRole)) {
            res.status(403).json({
                success: false,
                message: `Akses ditolak. Endpoint ini hanya dapat diakses oleh peran: [${allowedRoles.join(', ')}]. Peran Anda saat ini: ${authReq.userRole}`,
            });
            return;
        }
        next();
    };
}
