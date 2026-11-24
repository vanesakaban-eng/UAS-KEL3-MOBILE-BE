"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = void 0;
const db_1 = __importDefault(require("../config/db"));
const getAllUsers = async (req, res) => {
    try {
        // 1. Ambil semua data pengguna dari database
        const [users] = await db_1.default.query('SELECT id, nama, email, status, created_at, role FROM users ORDER BY created_at DESC');
        // 2. Hitung Statistik Otomatis dari Database
        const [totalRows] = await db_1.default.query('SELECT COUNT(*) as total FROM users');
        const totalTerdaftar = totalRows[0].total;
        const [activeRows] = await db_1.default.query("SELECT COUNT(*) as total FROM users WHERE status = 'Aktif'");
        const penggunaAktif = activeRows[0].total;
        const [inactiveRows] = await db_1.default.query("SELECT COUNT(*) as total FROM users WHERE status = 'Nonaktif'");
        const penggunaNonaktif = inactiveRows[0].total;
        // Hitung pendaftar bulan ini (Contoh query MySQL untuk bulan berjalan)
        const [monthlyRows] = await db_1.default.query("SELECT COUNT(*) as total FROM users WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data pengguna',
            error: error.message,
        });
    }
};
exports.getAllUsers = getAllUsers;
