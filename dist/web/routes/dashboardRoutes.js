"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.verifyToken);
// Endpoint final: GET /api/dashboard
router.get('/', (req, res) => {
    try {
        const dashboardData = {
            stats: {
                totalPengguna: 0,
                penggunaAktif: 0,
                penggunaBaru: 0,
                totalAktivitas: 0
            },
            features: [],
            recentUsers: []
        };
        res.status(200).json(dashboardData);
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
