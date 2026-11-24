import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket } from 'mysql2';


export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Hitung Total Pengguna
    const [totalUsersRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const totalPengguna = totalUsersRows[0].total;


    // 2. Ambil Daftar Pengguna Terbaru (5 data terakhir)
    // Pastikan ORDER BY menggunakan kolom waktu yang benar, misal created_at
    const [recentUsers] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, created_at, role FROM users ORDER BY created_at DESC LIMIT 5'
    );


    res.status(200).json({
      success: true,
      data: {
        totalPengguna,
        penggunaAktif: totalPengguna, // Bisa disesuaikan jika ada kolom status aktif
        penggunaBaru: 35,             // Bisa dikembangkan dengan query hitung data bulan ini jika mau dinamis
        totalAktivitas: 8430,         // Bisa disesuaikan jika ada tabel log aktivitas
        recentUsers
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dashboard',
      error: error.message
    });
  }
};

