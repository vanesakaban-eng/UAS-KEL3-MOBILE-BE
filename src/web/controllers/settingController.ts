import { Request, Response } from 'express';
import bcrypt from 'bcryptjs'; // Pastikan package bcryptjs / bcrypt sudah terinstal
import { settingsRepository } from '../repositories/settingsRepository';

// 1. Mengambil data profil asli dari database
export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid, silakan login ulang' });
    }

    const adminProfile = await settingsRepository.findProfileById(userId);

    if (!adminProfile) {
      return res.status(404).json({ success: false, message: 'Profil admin tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      data: adminProfile,
    });
  } catch (error) {
    console.error('Error getProfile:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat profil' });
  }
};

// 2. Menyimpan perubahan profil dari frontend
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, jabatan, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    const updatedProfile = await settingsRepository.updateProfileById(userId, {
      name,
      jabatan,
      phone,
    });

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error updateProfile:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan profil' });
  }
};

// 3. Mengubah kata sandi admin
export const updatePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama dan baru wajib diisi' });
    }

    // Ambil data user beserta password hash-nya dari repository
    const user = await settingsRepository.findUserWithPasswordById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    // Cek kecocokan kata sandi lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai' });
    }

    // Hash kata sandi baru lalu simpan
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await settingsRepository.updatePasswordById(userId, hashedPassword);

    return res.status(200).json({
      success: true,
      message: 'Kata sandi berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updatePassword:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi' });
  }
};

// 4. Mengambil daftar user khusus role Admin untuk tab Role & Akses
export const getRolesAndAccess = async (req: any, res: Response) => {
  try {
    const adminList = await settingsRepository.findAllAdmins();

    return res.status(200).json({
      success: true,
      data: adminList,
    });
  } catch (error) {
    console.error('Error getRolesAndAccess:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat data role & akses' });
  }
};

// 5. Mengubah jabatan admin (role dikunci tetap 'Admin')
export const updateAdminJabatan = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const jabatan = typeof req.body?.jabatan === 'string' ? req.body.jabatan.trim() : '';

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID admin wajib disertakan' });
    }

    const updated = await settingsRepository.updateAdminJabatanById(id, {
      jabatan: jabatan || null,
      role: 'Admin',
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      message: 'Jabatan admin berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Error updateAdminJabatan:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui jabatan admin' });
  }
};

// 6. Menambah admin baru dengan role otomatis 'Admin'
export const createAdmin = async (req: any, res: Response) => {
  try {
    const { name, email, password, jabatan } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await settingsRepository.createAdminUser({
      name: String(name).trim(),
      email: String(email).trim(),
      password: hashedPassword,
      jabatan: typeof jabatan === 'string' && jabatan.trim() ? jabatan.trim() : null,
      role: 'Admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Admin baru berhasil ditambahkan',
      data: created,
    });
  } catch (error: any) {
    console.error('Error createAdmin:', error);
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }
    return res.status(500).json({ success: false, message: 'Gagal menambahkan admin baru' });
  }
};

// 7. Mengambil daftar perangkat / sesi aktif milik admin yang sedang login
export const getSessions = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    const sessions = await settingsRepository.findSessionsByUserId(userId, req.headers['user-agent']);

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error getSessions:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat perangkat aktif' });
  }
};

// 8. Mengakhiri satu sesi perangkat berdasarkan ID
export const terminateSession = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID sesi wajib disertakan' });
    }

    await settingsRepository.deleteSessionById(userId, id);

    return res.status(200).json({
      success: true,
      message: 'Sesi perangkat berhasil diakhiri',
    });
  } catch (error) {
    console.error('Error terminateSession:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengakhiri sesi' });
  }
};

// 9. Mengakhiri seluruh sesi admin yang sedang login
export const logoutAll = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid' });
    }

    await settingsRepository.deleteAllSessionsByUserId(userId);

    return res.status(200).json({
      success: true,
      message: 'Semua sesi berhasil diakhiri',
    });
  } catch (error) {
    console.error('Error logoutAll:', error);
    return res.status(500).json({ success: false, message: 'Gagal melakukan logout dari semua sesi' });
  }
};