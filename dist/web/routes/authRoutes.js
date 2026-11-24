"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/logout', authMiddleware_1.verifyToken, authController_1.logout);
router.post('/lupa-sandi', authController_1.lupasandi);
// 🔒 Rute yang Dilindungi (Wajib pakai verifyToken karena khusus user yang sudah login)
router.get('/profile', authMiddleware_1.verifyToken, (req, res) => {
    // Logika ambil profil
});
exports.default = router;
