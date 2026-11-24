import { Request } from 'express';
import db from '../mobile/config/db';

export interface AuditLogParams {
  userId?: number | null;
  action: string;
  resource: string;
  resourceId?: string | number | null;
  details?: any;
  req?: Request;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const ipAddress =
      params.req?.ip ||
      (params.req?.headers['x-forwarded-for'] as string) ||
      params.req?.socket?.remoteAddress ||
      '';

    const detailsStr =
      typeof params.details === 'object'
        ? JSON.stringify(params.details)
        : params.details || null;

    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.userId || null,
        params.action,
        params.resource,
        params.resourceId != null ? String(params.resourceId) : null,
        detailsStr,
        ipAddress.slice(0, 50),
      ],
    );
  } catch (err) {
    // Fail-safe: Audit log failure should not crash the main transaction
    console.error('[AuditService] Gagal mencatat audit log:', err);
  }
}
