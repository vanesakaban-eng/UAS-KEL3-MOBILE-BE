import app from './app';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

// Pastikan baris ini ada:
app.use('/api/auth', authRoutes);

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});