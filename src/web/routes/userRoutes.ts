import { Router, Request, Response } from 'express';
import db from '../../mobile/config/db';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// Endpoint final: GET /api/users/web
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const sortParam = typeof req.query.sort === 'string' ? req.query.sort.trim() : '';

    // 1. Hitung statistik kartu di halaman Data Pengguna
    const [statRows]: any = await db.query(`
      SELECT
        COUNT(*) AS totalTerdaftar,
        COUNT(*) AS penggunaAktif,
        0 AS penggunaNonaktif,
        SUM(
          CASE
            WHEN YEAR(createdAt) = YEAR(CURDATE())
             AND MONTH(createdAt) = MONTH(CURDATE())
            THEN 1 ELSE 0
          END
        ) AS pendaftarBulanIni
      FROM users
      WHERE LOWER(role) = 'user'
    `);

    const s = statRows?.[0] || {};
    const stats = {
      totalTerdaftar: Number(s.totalTerdaftar || 0),
      penggunaAktif: Number(s.penggunaAktif || 0),
      penggunaNonaktif: Number(s.penggunaNonaktif || 0),
      pendaftarBulanIni: Number(s.pendaftarBulanIni || 0),
    };

    // 2. Bangun kondisi filter & urutan untuk daftar pengguna
    const whereClauses: string[] = [`LOWER(role) = 'user'`];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(nama LIKE ? OR email LIKE ?)');
      const keyword = `%${search}%`;
      params.push(keyword, keyword);
    }

    if (statusFilter.toLowerCase() === 'nonaktif') {
      whereClauses.push('1 = 0');
    }

    const orderBy =
      sortParam === 'oldest' || sortParam === 'asc'
        ? 'createdAt ASC, id ASC'
        : 'createdAt DESC, id DESC';

    const [userRows]: any = await db.query(
      `SELECT id, nama, email, whatsapp, jabatan, role, createdAt
       FROM users
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY ${orderBy}`,
      params
    );

    const formattedUsers = (userRows || []).map((row: any) => ({
      id: row.id,
      name: row.nama,
      nama: row.nama,
      email: row.email,
      whatsapp: row.whatsapp || '-',
      status: 'Aktif',
      createdAt: row.createdAt,
    }));

    return res.status(200).json({
      success: true,
      stats,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error GET /api/users/web:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;