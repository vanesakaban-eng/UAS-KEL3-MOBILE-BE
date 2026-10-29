import bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import nodemailer from 'nodemailer';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const jwtSecret = () => process.env.JWT_SECRET || 'uku_secret_key_2026';

function monthStart(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, month] = value.split('-').map(Number);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function dateValue(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

function userResponse(user: RowDataPacket) {
  return {
    id: user.id,
    name: user.nama,
    username: user.nama,
    email: user.email,
    phoneNumber: user.whatsapp || '',
    role: user.role,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const nama = req.body.nama ?? req.body.name ?? req.body.username;
  const { email, password } = req.body;
  const whatsapp = req.body.whatsapp ?? req.body.phoneNumber ?? '';

  if (typeof nama !== 'string' || !nama.trim() || typeof email !== 'string' ||
      !email.trim() || typeof password !== 'string' || password.length < 8 ||
      typeof whatsapp !== 'string') {
    res.status(400).json({ message: 'Nama, email, password minimal 8 karakter, dan nomor telepon yang valid diperlukan.' });
    return;
  }

  try {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.trim()],
    );
    if (existing.length) {
      res.status(409).json({ message: 'Email sudah terdaftar.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (nama, email, whatsapp, password, role) VALUES (?, ?, ?, ?, ?)',
      [nama.trim(), email.trim(), whatsapp.trim(), passwordHash, 'User'],
    );
    const user = {
      id: result.insertId,
      nama: nama.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      role: 'User',
    } as RowDataPacket;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret(),
      { expiresIn: '1d' },
    );
    res.status(201).json({ message: 'Registrasi berhasil.', token, user: userResponse(user) });
  } catch {
    res.status(500).json({ message: 'Registrasi gagal diproses.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ message: 'Email dan password wajib diisi.' });
    return;
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, whatsapp, password, role FROM users WHERE email = ? LIMIT 1',
      [email.trim()],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Email atau password salah.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret(),
      { expiresIn: '1d' },
    );
    res.json({ message: 'Login berhasil.', token, user: userResponse(user) });
  } catch {
    res.status(500).json({ message: 'Login gagal diproses.' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, nama, email, whatsapp, role FROM users WHERE id = ? LIMIT 1',
      [req.userId],
    );
    if (!rows[0]) {
      res.status(404).json({ message: 'Profil tidak ditemukan.' });
      return;
    }
    res.json({ user: userResponse(rows[0]) });
  } catch {
    res.status(500).json({ message: 'Profil gagal dimuat.' });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const nama = req.body.name ?? req.body.nama ?? req.body.username;
  const email = req.body.email;
  const whatsapp = req.body.phoneNumber ?? req.body.whatsapp ?? '';
  const password = req.body.password;
  if (typeof nama !== 'string' || !nama.trim() || typeof email !== 'string' ||
      !email.trim() || typeof whatsapp !== 'string' ||
      (password !== undefined && (typeof password !== 'string' || password.length < 8))) {
    res.status(400).json({ message: 'Nama, email, dan nomor telepon tidak valid.' });
    return;
  }
  try {
    if (typeof password === 'string' && password.length > 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET nama = ?, email = ?, whatsapp = ?, password = ? WHERE id = ?',
        [nama.trim(), email.trim(), whatsapp.trim(), passwordHash, req.userId],
      );
    } else {
      await db.query(
        'UPDATE users SET nama = ?, email = ?, whatsapp = ? WHERE id = ?',
        [nama.trim(), email.trim(), whatsapp.trim(), req.userId],
      );
    }
    res.json({ message: 'Profil berhasil diperbarui.' });
  } catch {
    res.status(500).json({ message: 'Profil gagal diperbarui.' });
  }
}

export async function getBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  const month = monthStart(req.query.month) ?? monthStart(new Date().toISOString().slice(0, 7))!;
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT amount FROM mobile_budgets WHERE user_id = ? AND month_start = ? LIMIT 1',
      [req.userId, month],
    );
    res.json({ month: month.slice(0, 7), amount: rows[0] ? Number(rows[0].amount) : 0 });
  } catch {
    res.status(500).json({ message: 'Budget gagal dimuat.' });
  }
}

export async function saveBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  const month = monthStart(req.body.month);
  const amount = Number(req.body.amount);
  if (!month || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: 'Bulan dan nominal budget harus valid.' });
    return;
  }
  try {
    await db.query(
      `INSERT INTO mobile_budgets (user_id, month_start, amount) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [req.userId, month, amount],
    );
    res.json({ message: 'Budget berhasil disimpan.', month: month.slice(0, 7), amount });
  } catch {
    res.status(500).json({ message: 'Budget gagal disimpan.' });
  }
}

export async function listTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const month = req.query.month ? monthStart(req.query.month) : null;
  if (req.query.month && !month) {
    res.status(400).json({ message: 'Format bulan harus YYYY-MM.' });
    return;
  }
  const filters = ['user_id = ?'];
  const values: unknown[] = [req.userId];
  if (month) {
    filters.push('transaction_date >= ?', 'transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)');
    values.push(month, month);
  }
  if (typeof req.query.type === 'string') {
    filters.push('transaction_type = ?');
    values.push(req.query.type);
  }
  if (typeof req.query.category === 'string') {
    filters.push('category = ?');
    values.push(req.query.category);
  }
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, saving_id, transaction_type, category, amount, transaction_date,
              location, purpose, method FROM mobile_transactions
       WHERE ${filters.join(' AND ')} ORDER BY transaction_date DESC, id DESC`,
      values,
    );
    res.json({ transactions: rows.map((row) => ({
      id: row.id,
      savingId: row.saving_id,
      type: row.transaction_type,
      category: row.category,
      title: row.category,
      amount: Number(row.amount),
      date: row.transaction_date instanceof Date
        ? row.transaction_date.toISOString().slice(0, 10)
        : String(row.transaction_date).slice(0, 10),
      location: row.location,
      purpose: row.purpose,
      method: row.method,
    })) });
  } catch {
    res.status(500).json({ message: 'Transaksi gagal dimuat.' });
  }
}

export async function createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { category, location = '', purpose = '', method = '' } = req.body;
  const type = req.body.type ?? 'expense';
  const amount = Number(req.body.amount);
  const date = dateValue(req.body.date);
  if (!['expense', 'income'].includes(type) || typeof category !== 'string' ||
      !category.trim() || !Number.isFinite(amount) || amount <= 0 || !date ||
      typeof location !== 'string' || typeof purpose !== 'string' || typeof method !== 'string') {
    res.status(400).json({ message: 'Data transaksi tidak valid.' });
    return;
  }
  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO mobile_transactions
       (user_id, transaction_type, category, amount, transaction_date, location, purpose, method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, type, category.trim(), amount, date, location.trim(), purpose.trim(), method.trim()],
    );
    res.status(201).json({ message: 'Transaksi berhasil dicatat.', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Transaksi gagal disimpan.' });
  }
}

export async function listSavings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, name, target_amount, current_amount, note, category
       FROM mobile_savings WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
      [req.userId],
    );
    res.json({ savings: rows.map((row) => ({
      id: row.id,
      name: row.name,
      target: Number(row.target_amount),
      current: Number(row.current_amount),
      note: row.note,
      category: row.category,
    })) });
  } catch {
    res.status(500).json({ message: 'Target tabungan gagal dimuat.' });
  }
}

export async function createSaving(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, note = '', category } = req.body;
  const target = Number(req.body.target);
  if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' ||
      !category.trim() || typeof note !== 'string' || !Number.isFinite(target) || target <= 0) {
    res.status(400).json({ message: 'Data target tabungan tidak valid.' });
    return;
  }
  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO mobile_savings (user_id, name, target_amount, note, category)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, name.trim(), target, note.trim(), category.trim()],
    );
    res.status(201).json({ message: 'Target tabungan berhasil dibuat.', id: result.insertId });
  } catch {
    res.status(500).json({ message: 'Target tabungan gagal dibuat.' });
  }
}

export async function addSavingDeposit(req: AuthenticatedRequest, res: Response): Promise<void> {
  const savingId = Number(req.params.id);
  const amount = Number(req.body.amount);
  const date = dateValue(req.body.date) ?? new Date().toISOString().slice(0, 10);
  if (!Number.isSafeInteger(savingId) || savingId <= 0 || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: 'Nominal setoran tidak valid.' });
    return;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT name, category FROM mobile_savings WHERE id = ? AND user_id = ? FOR UPDATE',
      [savingId, req.userId],
    );
    if (!rows[0]) {
      await connection.rollback();
      res.status(404).json({ message: 'Target tabungan tidak ditemukan.' });
      return;
    }
    await connection.query(
      'UPDATE mobile_savings SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?',
      [amount, savingId, req.userId],
    );
    await connection.query(
      `INSERT INTO mobile_transactions
       (user_id, saving_id, transaction_type, category, amount, transaction_date, purpose, method)
       VALUES (?, ?, 'saving', ?, ?, ?, ?, '')`,
      [req.userId, savingId, rows[0].category, amount, date, `Setoran tabungan · ${rows[0].name}`],
    );
    await connection.commit();
    res.status(201).json({ message: 'Setoran berhasil ditambahkan.' });
  } catch {
    await connection.rollback();
    res.status(500).json({ message: 'Setoran gagal disimpan.' });
  } finally {
    connection.release();
  }
}

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const month = monthStart(req.query.month) ?? monthStart(new Date().toISOString().slice(0, 7))!;
  try {
    const [[budgetRows], [totalRows], [categoryRows], [dailyRows]] = await Promise.all([
      db.query<RowDataPacket[]>(
        'SELECT amount FROM mobile_budgets WHERE user_id = ? AND month_start = ? LIMIT 1',
        [req.userId, month],
      ),
      db.query<RowDataPacket[]>(
        `SELECT transaction_type, SUM(amount) AS total FROM mobile_transactions
         WHERE user_id = ? AND transaction_date >= ? AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH)
         GROUP BY transaction_type`,
        [req.userId, month, month],
      ),
      db.query<RowDataPacket[]>(
        `SELECT category, SUM(amount) AS total FROM mobile_transactions
         WHERE user_id = ? AND transaction_type = 'expense' AND transaction_date >= ?
         AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY category`,
        [req.userId, month, month],
      ),
      db.query<RowDataPacket[]>(
        `SELECT DAY(transaction_date) AS day, SUM(amount) AS total FROM mobile_transactions
         WHERE user_id = ? AND transaction_type = 'expense' AND transaction_date >= ?
         AND transaction_date < DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY DAY(transaction_date)`,
        [req.userId, month, month],
      ),
    ]);
      const sum = (type: string) => Number(totalRows.find((row) => row.transaction_type === type)?.total ?? 0);
    const budget = Number(budgetRows[0]?.amount ?? 0);
    const expense = sum('expense');
    res.json({
      month: month.slice(0, 7),
      budget,
      expense,
      income: sum('income') + sum('saving'),
      remainingBudget: budget - expense,
      categoryTotals: Object.fromEntries(categoryRows.map((row) => [row.category, Number(row.total)])),
      dailyTotals: Object.fromEntries(dailyRows.map((row) => [String(row.day), Number(row.total)])),
    });
  } catch {
    res.status(500).json({ message: 'Ringkasan keuangan gagal dimuat.' });
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const email = req.body.email;
  if (typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ message: 'Masukkan alamat email yang valid.' });
    return;
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    res.status(503).json({ message: 'Layanan email belum dikonfigurasi.' });
    return;
  }

  try {
    const [users] = await db.query<RowDataPacket[]>(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [email.trim()],
    );
    if (users.length === 0) {
      res.json({ message: 'Jika email terdaftar, kode reset akan dikirim.' });
      return;
    }

    const user = users[0];
    const [recentRequests] = await db.query<RowDataPacket[]>(
      `SELECT user_id FROM mobile_password_resets
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)`,
      [user.id],
    );
    if (recentRequests.length > 0) {
      res.json({ message: 'Jika email terdaftar, kode reset akan dikirim.' });
      return;
    }

    const code = String(randomInt(100000, 1000000));
    const codeHash = createHash('sha256').update(code).digest('hex');
    await db.query(
      `INSERT INTO mobile_password_resets (user_id, code_hash, expires_at, attempts)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)
       ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash),
         expires_at = VALUES(expires_at), attempts = 0, created_at = CURRENT_TIMESTAMP`,
      [user.id, codeHash],
    );

    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || SMTP_USER,
        to: user.email,
        subject: 'Kode Reset Password UKu',
        text: `Kode reset password Anda: ${code}. Kode berlaku selama 10 menit. Jika Anda tidak meminta reset, abaikan email ini.`,
      });
    } catch (error) {
      await db.query('DELETE FROM mobile_password_resets WHERE user_id = ?', [user.id]);
      throw error;
    }

    res.json({ message: 'Jika email terdaftar, kode reset akan dikirim.' });
  } catch {
    res.status(502).json({ message: 'Kode reset gagal dikirim. Periksa konfigurasi email server.' });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, code, newPassword } = req.body;
  if (typeof email !== 'string' || typeof code !== 'string' ||
      !/^\d{6}$/.test(code) || typeof newPassword !== 'string' ||
      newPassword.length < 8) {
    res.status(400).json({ message: 'Email, kode 6 digit, dan password minimal 8 karakter diperlukan.' });
    return;
  }

  const connection = await db.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT r.user_id, r.code_hash, r.expires_at, r.attempts
       FROM mobile_password_resets r JOIN users u ON u.id = r.user_id
       WHERE u.email = ? FOR UPDATE`,
      [email.trim()],
    );
    const reset = rows[0];
    if (!reset || new Date(reset.expires_at).getTime() <= Date.now() ||
        Number(reset.attempts) >= 5) {
      await connection.rollback();
      transactionStarted = false;
      res.status(400).json({ message: 'Kode reset tidak valid atau kedaluwarsa.' });
      return;
    }

    const receivedHash = createHash('sha256').update(code).digest();
    const savedHash = Buffer.from(reset.code_hash, 'hex');
    if (receivedHash.length !== savedHash.length ||
        !timingSafeEqual(receivedHash, savedHash)) {
      await connection.query(
        'UPDATE mobile_password_resets SET attempts = attempts + 1 WHERE user_id = ?',
        [reset.user_id],
      );
      await connection.commit();
      transactionStarted = false;
      res.status(400).json({ message: 'Kode reset tidak valid atau kedaluwarsa.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE users SET password = ? WHERE id = ?', [
      passwordHash,
      reset.user_id,
    ]);
    await connection.query('DELETE FROM mobile_password_resets WHERE user_id = ?', [
      reset.user_id,
    ]);
    await connection.commit();
    transactionStarted = false;
    res.json({ message: 'Password berhasil diperbarui. Silakan login kembali.' });
  } catch {
    if (transactionStarted) await connection.rollback();
    res.status(500).json({ message: 'Password gagal diperbarui.' });
  } finally {
    connection.release();
  }
}