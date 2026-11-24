import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket } from 'mysql2';


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Ambil semua data pengguna dari database
    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, status, created_at, role FROM users ORDER BY created_at DESC'
    );


    // 2. Hitung Statistik Otomatis dari Database
    const [totalRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const totalTerdaftar = totalRows[0].total;


    const [activeRows] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM users WHERE status = 'Aktif'");
    const penggunaAktif = activeRows[0].total;


    const [inactiveRows] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM users WHERE status = 'Nonaktif'");
    const penggunaNonaktif = inactiveRows[0].total;


    // Hitung pendaftar bulan ini (Contoh query MySQL untuk bulan berjalan)
    const [monthlyRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())"
    );
    const pendaftarBulanIni = monthlyRows[0].total;


    // 3. Kirim response ke frontend
    res.status(200).json({
      success: true,
      stats: {
        totalTerdaftar,
        penggunaAktif,
        penggunaNonaktif,
        pendaftarBulanIni,
      },
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengguna',
      error: error.message,
    });
  }
};
