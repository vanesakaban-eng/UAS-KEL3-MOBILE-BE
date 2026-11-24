import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { getJwtSecret } from '../config/jwt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import nodemailer from 'nodemailer';


// Konfigurasi Nodemailer (opsional untuk fitur Lupa Sandi)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'email-anda@gmail.com',
    pass: process.env.EMAIL_PASS || 'password-aplikasi-gmail'
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


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = 'Admin';
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
    console.error("ERROR REGISTER:", error);
    res.status(500).json({ message: 'Terjadi kesalahan server', error: error.message });
  }
};


// 2. LOGIN (Mengecek kredensial di MySQL)
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log("Mencoba login untuk email:", email);


    const [users] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );


    if (users.length === 0) {
      res.status(400).json({ message: 'Email atau kata sandi salah!' });
      return;
    }


   const user = users[0];
    console.log("User ditemukan di database:", user.email);


    // 🔍 Tambahkan baris ini untuk cek password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Apakah password cocok?", isMatch); // <-- Cek ini di terminal nanti!


    if (!isMatch) {
      res.status(400).json({ message: 'Email atau kata sandi salah!' });
      return;
    }


    // Buat Token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '1d' }
    );
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
  } catch (error: any) {
    console.error("ERROR SAAT LOGIN:", error);
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


    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );


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
  } catch (error: any) {
    console.error("ERROR LUPA SANDI:", error);
    res.status(500).json({ message: 'Gagal mengirim email', error: error.message });
  }
};
