"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const db_1 = __importDefault(require("../config/db"));
const auditService_1 = require("./auditService");
async function listCategories(typeOnly) {
    let query = 'SELECT id, name, type, icon, color, is_active, created_at FROM master_categories WHERE is_active = TRUE';
    const params = [];
    if (typeOnly) {
        query += ' AND type = ?';
        params.push(typeOnly);
    }
    query += ' ORDER BY name ASC';
    const [rows] = await db_1.default.query(query, params);
    return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        type: r.type,
        icon: r.icon,
        color: r.color,
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
    }));
}
async function createCategory(adminId, data) {
    const [res] = (await db_1.default.query('INSERT INTO master_categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [data.name.trim(), data.type, data.icon || 'category', data.color || '#3b82f6']));
    await (0, auditService_1.logAudit)({
        userId: adminId,
        action: 'CREATE_CATEGORY',
        resource: 'master_categories',
        resourceId: res.insertId,
        details: data,
    });
    return res.insertId;
}
async function updateCategory(adminId, id, data) {
    const [res] = (await db_1.default.query(`UPDATE master_categories
     SET name = COALESCE(?, name),
         type = COALESCE(?, type),
         icon = COALESCE(?, icon),
         color = COALESCE(?, color),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`, [data.name?.trim() || null, data.type || null, data.icon || null, data.color || null, data.is_active ?? null, id]));
    if (res.affectedRows > 0) {
        await (0, auditService_1.logAudit)({
            userId: adminId,
            action: 'UPDATE_CATEGORY',
            resource: 'master_categories',
            resourceId: id,
            details: data,
        });
        return true;
    }
    return false;
}
async function deleteCategory(adminId, id) {
    // Soft delete (is_active = FALSE) agar transaksi lama tetap valid
    const [res] = (await db_1.default.query('UPDATE master_categories SET is_active = FALSE WHERE id = ?', [id]));
    if (res.affectedRows > 0) {
        await (0, auditService_1.logAudit)({
            userId: adminId,
            action: 'DELETE_CATEGORY',
            resource: 'master_categories',
            resourceId: id,
        });
        return true;
    }
    return false;
}
