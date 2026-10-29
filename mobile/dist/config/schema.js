"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = initializeSchema;
const db_1 = __importDefault(require("./db"));
async function initializeSchema() {
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_password_resets (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      code_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
    await db_1.default.query(`
    CREATE TABLE IF NOT EXISTS mobile_budgets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      month_start DATE NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_mobile_budget_user_month (user_id, month_start)
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
      KEY ix_mobile_transactions_saving (saving_id)
    ) ENGINE=InnoDB
  `);
}
