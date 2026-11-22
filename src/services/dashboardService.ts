import { RowDataPacket } from 'mysql2';
import db from '../config/db';

export async function getWebDashboardData() {
  // 1. Hitung total user & aktivitas (case-insensitive role)
  const [[userStats]] = (await db.query<RowDataPacket[]>(
    'SELECT COUNT(*) as totalUsers, SUM(CASE WHEN LOWER(role) = "admin" THEN 1 ELSE 0 END) as totalAdmin FROM users',
  )) as any;

  const [[txStats]] = (await db.query<RowDataPacket[]>(
    'SELECT COUNT(*) as totalAktivitas, COALESCE(SUM(amount), 0) as totalVolume FROM mobile_transactions',
  )) as any;

  const [[pendingAiStats]] = (await db.query<RowDataPacket[]>(
    'SELECT COUNT(*) as totalPendingAi FROM ai_results WHERE verification_status = "pending"',
  )) as any;

  // 2. Trend Bulanan (Aktivitas Transaksi)
  const [chartRows] = await db.query<RowDataPacket[]>(`
    SELECT 
      DATE_FORMAT(transaction_date, '%b') as month,
      MONTH(transaction_date) as monthNum,
      COUNT(*) as count,
      SUM(amount) as value
    FROM mobile_transactions
    WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY month, monthNum
    ORDER BY monthNum ASC
  `);

  // 3. Distribusi Kategori Pengeluaran
  const [categoryDistribution] = await db.query<RowDataPacket[]>(`
    SELECT category as name, COUNT(*) as count, SUM(amount) as total
    FROM mobile_transactions
    GROUP BY category
    ORDER BY total DESC
    LIMIT 6
  `);

  // 4. Pengguna Terbaru
  const [recentUsers] = await db.query<RowDataPacket[]>(
    'SELECT id, nama, email, role, COALESCE(createdAt, NOW()) as created_at FROM users ORDER BY id DESC LIMIT 5',
  );

  return {
    stats: {
      totalPengguna: Number(userStats?.totalUsers || 0),
      totalAdmin: Number(userStats?.totalAdmin || 0),
      totalAktivitas: Number(txStats?.totalAktivitas || 0),
      totalVolume: Number(txStats?.totalVolume || 0),
      pendingVerifikasiAi: Number(pendingAiStats?.totalPendingAi || 0),
    },
    chartAktivitas: chartRows.length > 0 ? chartRows : [
      { month: 'Jan', value: 120 },
      { month: 'Feb', value: 240 },
      { month: 'Mar', value: 310 },
      { month: 'Apr', value: 450 },
      { month: 'Mei', value: 520 },
      { month: 'Jun', value: 680 },
    ],
    penggunaanFitur: categoryDistribution.length > 0 ? categoryDistribution : [
      { name: 'Catat Pengeluaran', count: 45, color: '#f59e0b' },
      { name: 'Budget Bulanan', count: 30, color: '#3b82f6' },
      { name: 'Tabungan Impian', count: 25, color: '#10b981' },
      { name: 'AI Advisor', count: 18, color: '#8b5cf6' },
    ],
    recentUsers: recentUsers.map((u) => ({
      id: `USR-${u.id}`,
      name: u.nama,
      email: u.email,
      role: u.role,
      date: new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Aktif',
    })),
  };
}
