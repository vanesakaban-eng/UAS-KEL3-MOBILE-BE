"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingController_1 = require("../controllers/settingController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Endpoint: GET & PUT /api/settings/profile
router.get('/profile', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.getProfile);
router.put('/profile', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.updateProfile);
// Endpoint: PUT /api/settings/password
router.put('/password', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.updatePassword);
// Endpoint: GET /api/settings/roles & GET /api/settings/admins (Data Role & Akses khusus Admin)
router.get('/roles', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.getRolesAndAccess);
router.get('/admins', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.getRolesAndAccess);
// Endpoint: Role & Akses (Edit jabatan & tambah admin ber-role tunggal 'Admin')
router.put('/admins/:id', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.updateAdminJabatan);
router.post('/admins', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.createAdmin);
// Endpoint: Logout Sesi & Perangkat Aktif
router.get('/sessions', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.getSessions);
router.delete('/session/:id', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.terminateSession);
router.post('/logout-all', authMiddleware_1.verifyToken, authMiddleware_1.requireAdmin, settingController_1.logoutAll);
exports.default = router;
