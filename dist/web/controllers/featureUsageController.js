"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureUsageStats = void 0;
const getFeatureUsageStats = (req, res) => {
    try {
        // Anda bisa mengambil data ini dari database (misal: PostgreSQL / MongoDB / MySQL)
        // Di sini kita gunakan data statis/agregasi sesuai tampilan UI
        const featureData = {
            barChart: [
                { name: 'Catat Pengeluaran', count: 845, color: '#f59e0b' },
                { name: 'Budget', count: 620, color: '#3b82f6' },
                { name: 'Nabung', count: 430, color: '#10b981' },
                { name: 'AI Notifikasi', count: 380, color: '#a855f7' },
                { name: 'Rekap Aktivitas', count: 710, color: '#f97316' }
            ],
            pieChart: [
                { name: 'Catat Pengeluaran', percentage: 28, color: '#f59e0b' },
                { name: 'Budget', percentage: 20, color: '#3b82f6' },
                { name: 'Rekap Aktivitas', percentage: 18, color: '#06b6d4' },
                { name: 'Nabung', percentage: 15, color: '#10b981' },
                { name: 'AI Notifikasi', percentage: 12, color: '#a855f7' },
                { name: 'Lainnya', percentage: 7, color: '#9333ea' }
            ],
            details: [
                {
                    id: 1,
                    name: 'Catat Pengeluaran',
                    desc: 'Transaksi harian',
                    usage: '845 sesi',
                    status: 'Tinggi',
                    iconType: 'receipt',
                    iconBg: 'bg-amber-50 text-amber-600',
                    statusBg: 'bg-emerald-50 text-emerald-600',
                },
                {
                    id: 2,
                    name: 'Rekap Aktivitas',
                    desc: 'Laporan arus kas & grafik',
                    usage: '710 sesi',
                    status: 'Stabil',
                    iconType: 'pie-chart',
                    iconBg: 'bg-indigo-50 text-indigo-600',
                    statusBg: 'bg-emerald-50 text-emerald-600',
                },
                {
                    id: 3,
                    name: 'Budget',
                    desc: 'Limit anggaran pos bulanan',
                    usage: '620 sesi',
                    status: 'Stabil',
                    iconType: 'wallet',
                    iconBg: 'bg-blue-50 text-blue-600',
                    statusBg: 'bg-emerald-50 text-emerald-600',
                },
                {
                    id: 4,
                    name: 'Nabung',
                    desc: 'Target tabungan',
                    usage: '430 sesi',
                    status: 'Bertumbuh',
                    iconType: 'piggy',
                    iconBg: 'bg-emerald-50 text-emerald-600',
                    statusBg: 'bg-amber-50 text-amber-600',
                },
                {
                    id: 5,
                    name: 'AI Notifikasi',
                    desc: 'Insight rekomendasi & budget alert',
                    usage: '380 sesi',
                    status: 'Tinggi',
                    iconType: 'bot',
                    iconBg: 'bg-purple-50 text-purple-600',
                    statusBg: 'bg-emerald-50 text-emerald-600',
                }
            ]
        };
        return res.status(200).json({
            success: true,
            message: 'Berhasil mengambil data statistik penggunaan fitur',
            data: featureData
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
};
exports.getFeatureUsageStats = getFeatureUsageStats;
