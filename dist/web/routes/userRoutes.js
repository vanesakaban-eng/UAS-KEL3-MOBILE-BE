"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.verifyToken);
router.get('/users', (req, res) => {
    try {
        const usersData = {
            success: true,
            stats: {
                totalTerdaftar: 0,
                penggunaAktif: 0,
                penggunaNonaktif: 0,
                pendaftarBulanIni: 0
            },
            data: []
        };
        res.status(200).json(usersData);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
