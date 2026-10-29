import db from './config/db';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    // Hash password untuk akun dummy
    const passAdmin = await bcrypt.hash('Admin123!', 10);
    const passUser = await bcrypt.hash('User123!', 10);

    // Masukkan Akun Admin
    await db.query(
      `INSERT IGNORE INTO users (nama, email, whatsapp, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Budi Pratama (Admin)', 'admin@uku.id', '081234567890', passAdmin, 'Admin']
    );

    // Masukkan Akun User
    await db.query(
      `INSERT IGNORE INTO users (nama, email, whatsapp, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Siti Nurhaliza (User)', 'user@uku.id', '089876543210', passUser, 'User']
    );

    console.log('✅ Akun dummy berhasil dibuat di database MySQL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seed data:', err);
    process.exit(1);
  }
}

seed();