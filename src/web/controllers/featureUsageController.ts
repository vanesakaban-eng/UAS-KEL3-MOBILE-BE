import { Request, Response } from 'express';
import db from '../../mobile/config/db'; // sesuaikan path koneksi db ke db_uku

export const getFeatureUsageStats = async (_req: Request, res: Response) => {
  try {
    const [[expenseRow]]: any = await db.query(
      'SELECT COUNT(*) AS total FROM mobile_transactions'
    );
    const [[budgetRow]]: any = await db.query(
      'SELECT COUNT(*) AS total FROM mobile_budgets'
    );
    const [[savingRow]]: any = await db.query(
      'SELECT COUNT(*) AS total FROM mobile_savings'
    );

    const expenseCount = Number(expenseRow?.total || 0);
    const budgetCount = Number(budgetRow?.total || 0);
    const savingCount = Number(savingRow?.total || 0);
    // Contoh: rekap aktivitas merepresentasikan total aktivitas transaksi + tabungan
    const recapCount = expenseCount + savingCount;

    const rawFeatures = [
      {
        id: 1,
        name: 'Catat Pengeluaran',
        desc: 'Transaksi harian pengguna',
        count: expenseCount,
        color: '#f59e0b',
        iconType: 'receipt',
        iconBg: 'bg-amber-50 text-amber-600',
      },
      {
        id: 2,
        name: 'Rekap Aktivitas',
        desc: 'Laporan arus kas & aktivitas',
        count: recapCount,
        color: '#f97316',
        iconType: 'pie-chart',
        iconBg: 'bg-indigo-50 text-indigo-600',
      },
      {
        id: 3,
        name: 'Budget',
        desc: 'Limit anggaran pos bulanan',
        count: budgetCount,
        color: '#3b82f6',
        iconType: 'wallet',
        iconBg: 'bg-blue-50 text-blue-600',
      },
      {
        id: 4,
        name: 'Nabung',
        desc: 'Target tabungan pengguna',
        count: savingCount,
        color: '#10b981',
        iconType: 'piggy',
        iconBg: 'bg-emerald-50 text-emerald-600',
      },
    ];

    const totalUsage = rawFeatures.reduce((acc, item) => acc + item.count, 0);

    const barChart = rawFeatures.map(({ name, count, color }) => ({
      name,
      count,
      color,
    }));

    const pieChart = rawFeatures.map(({ name, count, color }) => ({
      name,
      percentage: totalUsage > 0 ? Math.round((count / totalUsage) * 100) : 0,
      color,
    }));

    const details = rawFeatures.map((item) => ({
      id: item.id,
      name: item.name,
      desc: item.desc,
      usage: `${item.count} sesi`,
      status: item.count > 0 ? 'Aktif' : 'Belum Digunakan',
      iconType: item.iconType,
      iconBg: item.iconBg,
      statusBg:
        item.count > 0
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-slate-100 text-slate-600',
    }));

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data statistik penggunaan fitur',
      data: {
        totalUsage,
        barChart,
        pieChart,
        details,
      },
    });
  } catch (error) {
    console.error('[getFeatureUsageStats]:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
    });
  }
};