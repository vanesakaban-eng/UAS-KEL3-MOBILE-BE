"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const getDashboardStats = async (req, res) => {
    try {
        // 1. Hitung Total Pengguna
        const [totalUsersRows] = await db_1.default.query('SELECT COUNT(*) as total FROM users');
        const totalPengguna = totalUsersRows[0].total;
        // 2. Ambil Daftar Pengguna Terbaru (5 data terakhir)
        // Pastikan ORDER BY menggunakan kolom waktu yang benar, misal created_at
        const [recentUsers] = await db_1.default.query('SELECT id, nama, email, created_at, role FROM users ORDER BY created_at DESC LIMIT 5');
        res.status(200).json({
            success: true,
            data: {
                totalPengguna,
                penggunaAktif: totalPengguna, // Bisa disesuaikan jika ada kolom status aktif
                penggunaBaru: 35, // Bisa dikembangkan dengan query hitung data bulan ini jika mau dinamis
                totalAktivitas: 8430, // Bisa disesuaikan jika ada tabel log aktivitas
                recentUsers
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data dashboard',
            error: error.message
        });
    }
};
exports.getDashboardStats = getDashboardStats;
