import 'dotenv/config';
import app from './app';
import { initializeSchema } from './config/schema';

const port = Number(process.env.MOBILE_PORT) || 5001;

void initializeSchema()
  .catch(() => {
    console.error('Schema mobile belum dapat disiapkan; pastikan MySQL dan db_uku tersedia.');
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`UKu mobile API berjalan pada port ${port}`);
    });
  });