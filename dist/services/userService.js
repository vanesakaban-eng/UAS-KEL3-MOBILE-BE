"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllUsers = listAllUsers;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
const db_1 = __importDefault(require("../config/db"));
const auditService_1 = require("./auditService");
async function listAllUsers(adminId) {
    const [rows] = await db_1.default.query('SELECT id, nama, email, whatsapp, role, COALESCE(createdAt, NOW()) as created_at FROM users ORDER BY id DESC');
    return rows.map((r) => ({
        id: Number(r.id),
        nama: r.nama,
        email: r.email,
        whatsapp: r.whatsapp || '',
        role: String(r.role).toLowerCase() === 'admin' ? 'admin' : 'user',
        created_at: r.created_at,
    }));
}
async function getUserById(userId) {
    const [rows] = await db_1.default.query('SELECT id, nama, email, whatsapp, role, COALESCE(createdAt, NOW()) as created_at FROM users WHERE id = ? LIMIT 1', [userId]);
    if (rows.length === 0)
        return null;
    const r = rows[0];
    return {
        id: Number(r.id),
        nama: r.nama,
        email: r.email,
        whatsapp: r.whatsapp || '',
        role: String(r.role).toLowerCase() === 'admin' ? 'admin' : 'user',
        created_at: r.created_at,
    };
}
async function updateUserRole(adminId, targetUserId, newRole) {
    const roleValue = newRole === 'admin' ? 'Admin' : 'User';
    const [res] = (await db_1.default.query('UPDATE users SET role = ? WHERE id = ?', [roleValue, targetUserId]));
    if (res.affectedRows > 0) {
        await (0, auditService_1.logAudit)({
            userId: adminId,
            action: 'UPDATE_USER_ROLE',
            resource: 'users',
            resourceId: targetUserId,
            details: { newRole: roleValue },
        });
        return true;
    }
    return false;
}
