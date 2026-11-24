import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.ENV_FILE || path.resolve(__dirname, '../.env'),
});

import app from './app';
import { initializeSchema } from './mobile/config/schema';

const port = Number(process.env.PORT) || Number(process.env.MOBILE_PORT) || 5001;

void initializeSchema()
  .then(() => {
    console.log('[Database] 5 Kategori Tabel berhasil diinisialisasi dan disiapkan.');
  })
  .catch((err) => {
    console.error('[Database Warning] Skema database belum dapat disiapkan; pastikan MySQL aktif dan database db_uku tersedia.', err.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`🚀 UKu Single Backend API berjalan di http://localhost:${port}`);
      console.log(`📡 Melayani: Mobile Flutter & Website NextJS`);
      console.log(`🤖 AI Service: Active (Gemini API with Fallback Engine)`);
      console.log(`====================================================`);
    });
  });
