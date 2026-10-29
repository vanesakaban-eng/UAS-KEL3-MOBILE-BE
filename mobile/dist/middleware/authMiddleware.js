"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const authorization = req.header('authorization');
    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : undefined;
    if (!token) {
        res.status(401).json({ message: 'Token autentikasi diperlukan.' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'uku_secret_key_2026');
        const userId = Number(payload.id);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(401).json({ message: 'Token autentikasi tidak valid.' });
            return;
        }
        req.userId = userId;
        next();
    }
    catch {
        res.status(401).json({ message: 'Token autentikasi tidak valid atau kedaluwarsa.' });
    }
}
