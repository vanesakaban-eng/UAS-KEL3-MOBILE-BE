import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import db from './mobile/config/db';
import aiRoutes from './mobile/routes/aiRoutes';
import auditRoutes from './mobile/routes/auditRoutes';
import categoryRoutes from './mobile/routes/categoryRoutes';
import dashboardRoutes from './mobile/routes/dashboardRoutes';
import mobileRoutes from './mobile/routes/mobileRoutes';
import userRoutes from './mobile/routes/userRoutes';

// Web
import authRoutes from './web/routes/authRoutes';
import DashboardRoutes from './web/routes/dashboardRoutes';
import UserRoutes from './web/routes/userRoutes';
import CategoryRoutes from './web/routes/categoryRoutes';
import settingsRoutes from './web/routes/settingRoutes';
import featureUsageRoutes from './web/routes/featureUsageRoutes';

const app: Application = express();

// Konfigurasi CORS agar Next.js Web Admin & Mobile dapat berkomunikasi dengan lancar
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());

// Root endpoint info
app.get('/', (_req: Request, res: Response) => {
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
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', service: 'uku-single-backend', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      service: 'uku-single-backend',
      database: 'unavailable',
      error: err.message,
    });
  }
});

// Web Admin Routes (Next.js)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard/web', DashboardRoutes);
app.use('/api/users/web', UserRoutes);
app.use('/api/categories/web', CategoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/feature-usage', featureUsageRoutes);

// Register Modular Routers (Sesuai Diagram Skema Single Backend)
app.use('/api/categories', categoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Mobile & Core Finansial Routes (Kompatibel penuh dengan Flutter App)
app.use('/api', mobileRoutes);

// Global Error Handler (HARUS di paling bawah)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server.',
  });
});

export default app;