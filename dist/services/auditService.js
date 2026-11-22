"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const db_1 = __importDefault(require("../config/db"));
async function logAudit(params) {
    try {
        const ipAddress = params.req?.ip ||
            params.req?.headers['x-forwarded-for'] ||
            params.req?.socket?.remoteAddress ||
            '';
        const detailsStr = typeof params.details === 'object'
            ? JSON.stringify(params.details)
            : params.details || null;
        await db_1.default.query(`INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            params.userId || null,
            params.action,
            params.resource,
            params.resourceId != null ? String(params.resourceId) : null,
            detailsStr,
            ipAddress.slice(0, 50),
        ]);
    }
    catch (err) {
        // Fail-safe: Audit log failure should not crash the main transaction
        console.error('[AuditService] Gagal mencatat audit log:', err);
    }
}
