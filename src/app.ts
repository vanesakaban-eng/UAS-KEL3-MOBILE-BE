import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import db from './config/db';
import aiRoutes from './routes/aiRoutes';
import auditRoutes from './routes/auditRoutes';
import categoryRoutes from './routes/categoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import mobileRoutes from './routes/mobileRoutes';
import userRoutes from './routes/userRoutes';

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
      users: '/api/users',
      categories: '/api/categories',
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
    res.status(503).json({ status: 'error', service: 'uku-single-backend', database: 'unavailable', error: err.message });
  }
});

// Register Modular Routers (Sesuai Diagram Skema Single Backend)
app.use('/api/categories', categoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// Mobile & Core Finansial Routes (Kompatibel penuh dengan Flutter App)
app.use('/api', mobileRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server.',
  });
});

export default app;
