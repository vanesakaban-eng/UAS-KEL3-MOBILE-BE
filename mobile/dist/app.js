"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const mobileRoutes_1 = __importDefault(require("./routes/mobileRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', mobileRoutes_1.default);
app.get('/', (_req, res) => {
    res.json({ message: 'UKu mobile API siap digunakan.' });
});
app.get('/api/health', async (_req, res) => {
    try {
        await db_1.default.query('SELECT 1');
        res.status(200).json({ status: 'ok', service: 'mobile-api', database: 'connected' });
    }
    catch {
        res.status(503).json({ status: 'error', service: 'mobile-api', database: 'unavailable' });
    }
});
exports.default = app;
