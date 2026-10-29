import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import db from './config/db';
import mobileRoutes from './routes/mobileRoutes';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use('/api', mobileRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'UKu mobile API siap digunakan.' });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', service: 'mobile-api', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', service: 'mobile-api', database: 'unavailable' });
  }
});

export default app;
