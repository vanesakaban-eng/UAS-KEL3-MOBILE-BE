import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'email-anda@gmail.com',         // Email pengirim
    pass: 'password-aplikasi-gmail'       // App Password dari Google
  }
});

// 1. REGISTER (Menyimpan data ke MySQL)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, email, whatsapp, password, role } = req.body;

    // Cek apakah email sudah terdaftar
    const [existingUsers] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ message: 'Email sudah terdaftar!' });
      return;
    }

    // Hash kata sandi dengan Bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'User';
    const userWhatsapp = whatsapp || '';

    // Simpan ke MySQL
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (nama, email, whatsapp, password, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, userWhatsapp, hashedPassword, userRole]
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      user: {
        id: result.insertId,
        nama,
        email,
        role: userRole,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 2. LOGIN (Mengecek kredensial di MySQL)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(400).json({ message: 'Email atau kata sandi salah!' });
      return;
    }

    const user = users[0];

    // Verifikasi kata sandi
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Email atau kata sandi salah!' });
      return;
    }

    // Buat Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'uku_secret_key_2026',
      { expiresIn: '1d' }
    );

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
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};

// 3. LOGOUT
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({ message: 'Logout berhasil, sesi telah diakhiri!' });
};

// 4. FORGOT PASSWORD (Permintaan Reset Sandi)
export const lupasandi = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Cek apakah email terdaftar di database
    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(404).json({ message: 'Email tidak ditemukan di sistem kami.' });
      return;
    }

    // Konfigurasi isi email
    const mailOptions = {
      from: 'UKu Financial <email-anda@gmail.com>',
      to: email,
      subject: 'Reset Kata Sandi UKu',
      text: `Halo, Anda meminta tautan untuk mereset kata sandi akun UKu Anda. Silakan klik tautan berikut untuk melanjutkan.`
    };

    // Eksekusi pengiriman email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Tautan reset kata sandi berhasil dikirim ke email Anda.' 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengirim email', error: error.message });
  }
};