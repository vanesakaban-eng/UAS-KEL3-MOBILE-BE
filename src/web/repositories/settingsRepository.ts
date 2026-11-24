import db from '../config/db';

const parseDeviceInfo = (userAgent?: string) => {
  const ua = userAgent || 'Browser Web';
  const lower = ua.toLowerCase();

  let device = 'Browser Web';
  if (lower.includes('iphone')) {
    device = 'Safari on iPhone';
  } else if (lower.includes('android')) {
    device = 'Chrome on Android';
  } else if (lower.includes('ipad')) {
    device = 'Safari on iPad';
  } else if (lower.includes('edg/')) {
    device = lower.includes('mac') ? 'Edge on macOS' : 'Edge on Windows';
  } else if (lower.includes('chrome/')) {
    if (lower.includes('mac')) device = 'Chrome on macOS';
    else if (lower.includes('linux')) device = 'Chrome on Linux';
    else device = 'Chrome on Windows';
  } else if (lower.includes('firefox/')) {
    device = lower.includes('mac') ? 'Firefox on macOS' : 'Firefox on Windows';
  } else if (lower.includes('safari/') && !lower.includes('chrome')) {
    device = lower.includes('mac') ? 'Safari on macOS' : 'Browser Safari';
  }

  let os = 'Perangkat Aktif';
  if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS / iPadOS';
  else if (lower.includes('linux')) os = 'Linux';

  return { device, os, rawUa: ua };
};

export const settingsRepository = {
  // 1. Ambil data profil berdasarkan ID user yang login
  findProfileById: async (userId: string) => {
    const [rows]: any = await db.query(
      `SELECT id, nama AS name, email, whatsapp AS phone, jabatan, role
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      jabatan: row.jabatan ?? '',
      role: row.role ?? 'Admin',
      empId: `EMP-${String(row.id).padStart(4, '0')}`,
      status: 'Aktif',
    };
  },

  // 2. Update data profil ke tabel users
  updateProfileById: async (
    userId: string,
    data: { name?: string; jabatan?: string; phone?: string }
  ) => {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('nama = ?');
      params.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('whatsapp = ?');
      params.push(data.phone);
    }
    if (data.jabatan !== undefined) {
      updates.push('jabatan = ?');
      params.push(data.jabatan || null);
    }

    if (updates.length > 0) {
      params.push(userId);
      await db.query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = ?`,
        params
      );
    }

    return await settingsRepository.findProfileById(userId);
  },

  // 3. Ambil data user beserta password-nya (untuk verifikasi ganti sandi)
  findUserWithPasswordById: async (userId: string) => {
    const [rows]: any = await db.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );
    return rows[0];
  },

  // 4. Update password baru ke database
  updatePasswordById: async (userId: string, hashedPassword: string) => {
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return true;
  },

  // 5. Ambil daftar semua pengguna dengan role Admin (untuk tab Role & Akses)
  findAllAdmins: async () => {
    const [rows]: any = await db.query(
      `SELECT id, nama AS name, email, whatsapp AS phone, jabatan, role
       FROM users
       WHERE role = ?
       ORDER BY id ASC`,
      ['Admin']
    );

    return rows.map((row: any) => ({
      ...row,
      name: row.name ?? '',
      email: row.email ?? '',
      jabatan: row.jabatan ?? null,
      role: row.role ?? 'Admin',
      empId: `EMP-${String(row.id).padStart(4, '0')}`,
      status: 'Aktif',
    }));
  },

  // 6. Update jabatan admin (role dikunci tetap 'Admin')
  updateAdminJabatanById: async (
    id: number | string,
    data: { jabatan: string | null; role: string }
  ) => {
    const jabatanValue = data.jabatan && data.jabatan.trim() ? data.jabatan.trim() : null;

    await db.query(
      `UPDATE users
       SET jabatan = ?, role = 'Admin'
       WHERE id = ? AND role = 'Admin'`,
      [jabatanValue, id]
    );

    const [rows]: any = await db.query(
      `SELECT id, nama AS name, email, whatsapp AS phone, jabatan, role
       FROM users
       WHERE id = ? AND role = 'Admin'`,
      [id]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      jabatan: row.jabatan ?? null,
      role: 'Admin',
    };
  },

  // 7. Tambah admin baru ke tabel users dengan role otomatis 'Admin'
  createAdminUser: async (data: {
    name: string;
    email: string;
    password: string;
    jabatan: string | null;
    role: string;
  }) => {
    const jabatanValue = data.jabatan && data.jabatan.trim() ? data.jabatan.trim() : null;

    const [result]: any = await db.query(
      `INSERT INTO users (nama, email, password, whatsapp, jabatan, role)
       VALUES (?, ?, ?, '', ?, 'Admin')`,
      [data.name, data.email, data.password, jabatanValue]
    );

    return {
      id: result.insertId,
      name: data.name,
      email: data.email,
      jabatan: jabatanValue,
      role: 'Admin',
    };
  },

  // 8. Ambil daftar perangkat aktif milik user dari tabel user_sessions
  findSessionsByUserId: async (userId: string | number, userAgent?: string) => {
    const [rows]: any = await db.query(
      `SELECT id, user_id, device, os, user_agent, last_active
       FROM user_sessions
       WHERE user_id = ?
       ORDER BY last_active DESC, id DESC`,
      [userId]
    );

    const parsedCurrent = parseDeviceInfo(userAgent);

    if (!rows || rows.length === 0) {
      const [inserted]: any = await db.query(
        `INSERT INTO user_sessions (user_id, device, os, user_agent)
         VALUES (?, ?, ?, ?)`,
        [userId, parsedCurrent.device, parsedCurrent.os, parsedCurrent.rawUa]
      );

      return [
        {
          id: inserted.insertId,
          device: parsedCurrent.device,
          os: parsedCurrent.os,
          lastActive: 'Baru saja',
          isCurrent: true,
        },
      ];
    }

    return rows.map((row: any, index: number) => {
      const isCurrent =
        (userAgent && row.user_agent === userAgent) ||
        (!userAgent && index === 0) ||
        (rows.length === 1 && index === 0);

      return {
        id: row.id,
        device: row.device || 'Perangkat Aktif',
        os: row.os || 'Sesi aktif',
        lastActive: row.last_active,
        isCurrent,
      };
    });
  },

  // 9. Akhiri satu sesi perangkat berdasarkan ID & user_id
  deleteSessionById: async (userId: string | number, sessionId: string | number) => {
    const [result]: any = await db.query(
      `DELETE FROM user_sessions
       WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    return {
      userId,
      sessionId,
      affectedRows: result?.affectedRows ?? 0,
      terminated: true,
    };
  },

  // 10. Akhiri seluruh sesi milik user
  deleteAllSessionsByUserId: async (userId: string | number) => {
    const [result]: any = await db.query(
      `DELETE FROM user_sessions
       WHERE user_id = ?`,
      [userId]
    );

    return {
      userId,
      affectedRows: result?.affectedRows ?? 0,
      terminatedAll: true,
    };
  },
};