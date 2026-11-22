"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = initializeSchema;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("./db"));
async function initializeSchema() {
    // 1. KATEGORI PENGGUNA DAN PERAN: Tabel users
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      whatsapp VARCHAR(50) NOT NULL DEFAULT '',
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY ix_users_role (role)
    ) ENGINE=InnoDB
  `);
    // Tabel verifikasi pendaftaran & reset password
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_pending_registrations (
      email VARCHAR(255) NOT NULL PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(50) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NOT NULL,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_password_resets (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
    // 2. KATEGORI DATA MASTER: Tabel master_categories
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS master_categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
      icon VARCHAR(100) NOT NULL DEFAULT 'category',
      color VARCHAR(50) NOT NULL DEFAULT '#3b82f6',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_master_cat_type (type),
      KEY ix_master_cat_active (is_active)
    ) ENGINE=InnoDB
  `);
    // 3. KATEGORI TRANSAKSI / AKTIVITAS FINANSIAL
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_budgets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      month_start DATE NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_mobile_budget_user_month (user_id, month_start),
      KEY ix_mobile_budget_user (user_id)
    ) ENGINE=InnoDB
  `);
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_savings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(150) NOT NULL,
      target_amount DECIMAL(15, 2) NOT NULL,
      current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      note TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_mobile_savings_user (user_id)
    ) ENGINE=InnoDB
  `);
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_transactions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NULL,
      saving_id BIGINT UNSIGNED NULL,
      transaction_type ENUM('expense', 'income', 'saving') NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      transaction_date DATE NOT NULL,
      location VARCHAR(255) NOT NULL DEFAULT '',
      purpose TEXT NOT NULL,
      method VARCHAR(50) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_mobile_transactions_user_date (user_id, transaction_date),
      KEY ix_mobile_transactions_saving (saving_id),
      KEY ix_mobile_transactions_type (transaction_type)
    ) ENGINE=InnoDB
  `);
    // 4. KATEGORI HASIL AI (dengan status verifikasi manual oleh Web Admin)
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      prompt_type VARCHAR(50) NOT NULL DEFAULT 'financial_insight',
      raw_input TEXT NOT NULL,
      sanitized_input TEXT NOT NULL,
      ai_output_json JSON NOT NULL,
      verification_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      verified_by BIGINT UNSIGNED NULL,
      verification_note TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME NULL,
      KEY ix_ai_user (user_id),
      KEY ix_ai_status (verification_status),
      KEY ix_ai_created (created_at)
    ) ENGINE=InnoDB
  `);
    // 5. KATEGORI LOG AUDIT (Audit Trail aktivitas pengguna & admin)
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100) NOT NULL,
      resource_id VARCHAR(100) NULL,
      details TEXT NULL,
      ip_address VARCHAR(50) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_audit_user (user_id),
      KEY ix_audit_action (action),
      KEY ix_audit_resource (resource)
    ) ENGINE=InnoDB
  `);
    // SEED DATA MASTER KATEGORI DEFAULT JIKA KOSONG
    await seedDefaultMasterCategories();
    // SEED PENGGUNA DEFAULT (ADMIN & USER) JIKA KOSONG
    await seedDefaultUsers();
}
async function seedDefaultMasterCategories() {
    const [rows] = (await db_1.default.query('SELECT COUNT(*) AS cnt FROM master_categories'));
    if (rows[0]?.cnt > 0)
        return;
    const defaultCategories = [
        { name: 'Makanan & Minuman', type: 'expense', icon: 'fastfood', color: '#f59e0b' },
        { name: 'Transportasi', type: 'expense', icon: 'directions_car', color: '#3b82f6' },
        { name: 'Belanja & Kebutuhan', type: 'expense', icon: 'shopping_bag', color: '#10b981' },
        { name: 'Tagihan & Utilitas', type: 'expense', icon: 'receipt_long', color: '#ef4444' },
        { name: 'Hiburan & Liburan', type: 'expense', icon: 'movie', color: '#8b5cf6' },
        { name: 'Kesehatan & Medis', type: 'expense', icon: 'medical_services', color: '#ec4899' },
        { name: 'Pendidikan', type: 'expense', icon: 'school', color: '#06b6d4' },
        { name: 'Gaji Pokok', type: 'income', icon: 'account_balance_wallet', color: '#10b981' },
        { name: 'Bonus & Hadiah', type: 'income', icon: 'card_giftcard', color: '#3b82f6' },
        { name: 'Investasi & Bunga', type: 'income', icon: 'trending_up', color: '#8b5cf6' },
    ];
    for (const cat of defaultCategories) {
        await db_1.default.query('INSERT IGNORE INTO master_categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [cat.name, cat.type, cat.icon, cat.color]);
    }
}
async function seedDefaultUsers() {
    // Seed default admin jika belum ada
    const [adminRows] = (await db_1.default.query('SELECT id FROM users WHERE email = ?', ['admin@uku.id']));
    if (adminRows.length === 0) {
        const adminPassHash = await bcryptjs_1.default.hash('Admin123!', 10);
        await db_1.default.query(`INSERT INTO users (nama, email, whatsapp, password, role)
       VALUES (?, ?, ?, ?, ?)`, ['Administrator UKu', 'admin@uku.id', '081234567890', adminPassHash, 'admin']);
    }
    // Seed default regular user jika belum ada
    const [userRows] = (await db_1.default.query('SELECT id FROM users WHERE email = ?', ['user@uku.id']));
    if (userRows.length === 0) {
        const userPassHash = await bcryptjs_1.default.hash('User123!', 10);
        await db_1.default.query(`INSERT INTO users (nama, email, whatsapp, password, role)
       VALUES (?, ?, ?, ?, ?)`, ['Pengguna Demo', 'user@uku.id', '089876543210', userPassHash, 'user']);
    }
}
