"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const featureUsageController_1 = require("../controllers/featureUsageController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.verifyToken);
// Endpoint yang akan diakses oleh frontend Next.js
router.get('/feature-usage', featureUsageController_1.getFeatureUsageStats);
exports.default = router;
