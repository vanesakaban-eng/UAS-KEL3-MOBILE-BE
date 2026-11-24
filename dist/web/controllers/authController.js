"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lupasandi = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../config/jwt");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Konfigurasi Nodemailer (opsional untuk fitur Lupa Sandi)
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'email-anda@gmail.com',
        pass: process.env.EMAIL_PASS || 'password-aplikasi-gmail'
    }
});
// 1. REGISTER (Menyimpan data ke MySQL)
const register = async (req, res) => {
    try {
        const nama = req.body.nama || req.body.name || req.body.username;
        const { email, password } = req.body;
        const whatsapp = req.body.whatsapp || req.body.phoneNumber || '';
        const userRole = req.body.role || 'User';
        if (!nama || !email || !password) {
            res.status(400).json({ message: 'Nama, email, dan password wajib diisi!' });
            return;
        }
        // Cek apakah email sudah terdaftar
        const [existingUsers] = await db_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            res.status(400).json({ message: 'Email sudah terdaftar!' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const userWhatsapp = whatsapp || '';
        // Simpan ke MySQL
        const [result] = await db_1.default.query('INSERT INTO users (nama, email, whatsapp, password, role) VALUES (?, ?, ?, ?, ?)', [nama, email, userWhatsapp, hashedPassword, userRole]);
        res.status(201).json({
            message: 'Registrasi berhasil!',
            user: {
                id: result.insertId,
                nama,
                email,
                role: userRole,
            },
        });
    }
    catch (error) {
        console.error("ERROR REGISTER:", error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
};
exports.register = register;
// 2. LOGIN (Mengecek kredensial di MySQL)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Mencoba login untuk email:", email);
        const [users] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(400).json({ message: 'Email atau kata sandi salah!' });
            return;
        }
        const user = users[0];
        console.log("User ditemukan di database:", user.email);
        // 🔍 Tambahkan baris ini untuk cek password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        console.log("Apakah password cocok?", isMatch); // <-- Cek ini di terminal nanti!
        if (!isMatch) {
            res.status(400).json({ message: 'Email atau kata sandi salah!' });
            return;
        }
        // Buat Token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, (0, jwt_1.getJwtSecret)(), { expiresIn: '1d' });
        console.log("Token berhasil dibuat, mengirim respons ke frontend..."); // <-- Cek ini
        res.status(200).json({
            message: 'Login berhasil!',
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("ERROR SAAT LOGIN:", error);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
    }
};
exports.login = login;
// 3. LOGOUT
const logout = (req, res) => {
    res.status(200).json({ message: 'Logout berhasil, sesi telah diakhiri!' });
};
exports.logout = logout;
// 4. FORGOT PASSWORD (Permintaan Reset Sandi)
const lupasandi = async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await db_1.default.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            res.status(404).json({ message: 'Email tidak ditemukan di sistem kami.' });
            return;
        }
        const mailOptions = {
            from: 'UKu Financial <noreply@uku.id>',
            to: email,
            subject: 'Reset Kata Sandi UKu',
            text: `Halo, Anda meminta tautan untuk mereset kata sandi akun UKu Anda.`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({
            message: 'Tautan reset kata sandi berhasil dikirim ke email Anda.'
        });
    }
    catch (error) {
        console.error("ERROR LUPA SANDI:", error);
        res.status(500).json({ message: 'Gagal mengirim email', error: error.message });
    }
};
exports.lupasandi = lupasandi;
