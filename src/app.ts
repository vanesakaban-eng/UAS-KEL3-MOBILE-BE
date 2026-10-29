import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

const app: Application = express();

app.use(cors());
app.use(express.json());

// Test route untuk root '/'
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Backend UKu siap digunakan! 🚀' });
});

// Endpoint Auth
app.use('/api/auth', authRoutes);

export default app;