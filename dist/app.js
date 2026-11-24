"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./mobile/config/db"));
const aiRoutes_1 = __importDefault(require("./mobile/routes/aiRoutes"));
const auditRoutes_1 = __importDefault(require("./mobile/routes/auditRoutes"));
const categoryRoutes_1 = __importDefault(require("./mobile/routes/categoryRoutes"));
const dashboardRoutes_1 = __importDefault(require("./mobile/routes/dashboardRoutes"));
const mobileRoutes_1 = __importDefault(require("./mobile/routes/mobileRoutes"));
const userRoutes_1 = __importDefault(require("./mobile/routes/userRoutes"));
// Web
const authRoutes_1 = __importDefault(require("./web/routes/authRoutes"));
const dashboardRoutes_2 = __importDefault(require("./web/routes/dashboardRoutes"));
const userRoutes_2 = __importDefault(require("./web/routes/userRoutes"));
const categoryRoutes_2 = __importDefault(require("./web/routes/categoryRoutes"));
const settingRoutes_1 = __importDefault(require("./web/routes/settingRoutes"));
const featureUsageRoutes_1 = __importDefault(require("./web/routes/featureUsageRoutes"));
const app = (0, express_1.default)();
// Konfigurasi CORS agar Next.js Web Admin & Mobile dapat berkomunikasi dengan lancar
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Root endpoint info
app.get('/', (_req, res) => {
    res.json({
        service: 'UKu Single Backend API',
        version: '1.0.0',
        description: 'REST API tunggal yang melayani Mobile Flutter dan Web Admin Next.js',
        endpoints: {
            auth: '/api/auth/*',
            users: '/api/users & /api/users/web',
            categories: '/api/categories & /api/categories/web',
            transactions: '/api/transactions',
            dashboard: '/api/dashboard/web & /api/dashboard',
            ai: '/api/ai/analyze, /api/ai/pending, /api/ai/:id/verify',
            audit: '/api/audit-logs',
        },
    });
});
// Health check endpoint
app.get('/api/health', async (_req, res) => {
    try {
        await db_1.default.query('SELECT 1');
        res.status(200).json({ status: 'ok', service: 'uku-single-backend', database: 'connected' });
    }
    catch (err) {
        res.status(503).json({
            status: 'error',
            service: 'uku-single-backend',
            database: 'unavailable',
            error: err.message,
        });
    }
});
// Web Admin Routes (Next.js)
app.use('/api/auth', authRoutes_1.default);
app.use('/api/dashboard/web', dashboardRoutes_2.default);
app.use('/api/users/web', userRoutes_2.default);
app.use('/api/categories/web', categoryRoutes_2.default);
app.use('/api/settings', settingRoutes_1.default);
app.use('/api/feature-usage', featureUsageRoutes_1.default);
// Register Modular Routers (Sesuai Diagram Skema Single Backend)
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/audit-logs', auditRoutes_1.default);
// Mobile & Core Finansial Routes (Kompatibel penuh dengan Flutter App)
app.use('/api', mobileRoutes_1.default);
// Global Error Handler (HARUS di paling bawah)
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Terjadi kesalahan internal server.',
    });
});
exports.default = app;
