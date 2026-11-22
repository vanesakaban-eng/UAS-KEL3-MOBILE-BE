import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import { logAudit } from './auditService';

export interface UserSummary {
  id: number;
  nama: string;
  email: string;
  whatsapp: string;
  role: 'admin' | 'user';
  created_at: string;
}

export async function listAllUsers(adminId: number): Promise<UserSummary[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id, nama, email, whatsapp, role, COALESCE(createdAt, NOW()) as created_at FROM users ORDER BY id DESC',
  );

  return rows.map((r) => ({
    id: Number(r.id),
    nama: r.nama,
    email: r.email,
    whatsapp: r.whatsapp || '',
    role: String(r.role).toLowerCase() === 'admin' ? 'admin' : 'user',
    created_at: r.created_at,
  }));
}

export async function getUserById(userId: number): Promise<UserSummary | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id, nama, email, whatsapp, role, COALESCE(createdAt, NOW()) as created_at FROM users WHERE id = ? LIMIT 1',
    [userId],
  );

  if (rows.length === 0) return null;
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

export async function updateUserRole(
  adminId: number,
  targetUserId: number,
  newRole: 'admin' | 'user',
): Promise<boolean> {
  const roleValue = newRole === 'admin' ? 'Admin' : 'User';
  const [res] = (await db.query('UPDATE users SET role = ? WHERE id = ?', [roleValue, targetUserId])) as any[];

  if (res.affectedRows > 0) {
    await logAudit({
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
