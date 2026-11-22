import { RowDataPacket } from 'mysql2';
import db from '../config/db';
import { logAudit } from './auditService';

export interface MasterCategory {
  id: number;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export async function listCategories(typeOnly?: 'expense' | 'income'): Promise<MasterCategory[]> {
  let query = 'SELECT id, name, type, icon, color, is_active, created_at FROM master_categories WHERE is_active = TRUE';
  const params: any[] = [];

  if (typeOnly) {
    query += ' AND type = ?';
    params.push(typeOnly);
  }

  query += ' ORDER BY name ASC';
  const [rows] = await db.query<RowDataPacket[]>(query, params);
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

export async function createCategory(
  adminId: number,
  data: { name: string; type: 'expense' | 'income'; icon?: string; color?: string },
): Promise<number> {
  const [res] = (await db.query(
    'INSERT INTO master_categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
    [data.name.trim(), data.type, data.icon || 'category', data.color || '#3b82f6'],
  )) as any[];

  await logAudit({
    userId: adminId,
    action: 'CREATE_CATEGORY',
    resource: 'master_categories',
    resourceId: res.insertId,
    details: data,
  });

  return res.insertId;
}

export async function updateCategory(
  adminId: number,
  id: number,
  data: { name?: string; type?: 'expense' | 'income'; icon?: string; color?: string; is_active?: boolean },
): Promise<boolean> {
  const [res] = (await db.query(
    `UPDATE master_categories
     SET name = COALESCE(?, name),
         type = COALESCE(?, type),
         icon = COALESCE(?, icon),
         color = COALESCE(?, color),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [data.name?.trim() || null, data.type || null, data.icon || null, data.color || null, data.is_active ?? null, id],
  )) as any[];

  if (res.affectedRows > 0) {
    await logAudit({
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

export async function deleteCategory(adminId: number, id: number): Promise<boolean> {
  // Soft delete (is_active = FALSE) agar transaksi lama tetap valid
  const [res] = (await db.query('UPDATE master_categories SET is_active = FALSE WHERE id = ?', [id])) as any[];
  if (res.affectedRows > 0) {
    await logAudit({
      userId: adminId,
      action: 'DELETE_CATEGORY',
      resource: 'master_categories',
      resourceId: id,
    });
    return true;
  }
  return false;
}
