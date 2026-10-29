import { Request, Response, NextFunction } from 'express';

export const validateRegisterManual = (req: Request, res: Response, next: NextFunction) => {
  const { nama, email, whatsapp, password } = req.body;

  // 1. Validasi Nama: Wajib String & Maksimal 100 Karakter (VARCHAR(100))
  if (!nama || typeof nama !== 'string') {
    return res.status(400).json({ success: false, message: 'Nama wajib diisi dan harus berupa teks (string).' });
  }
  if (nama.length > 100) {
    return res.status(400).json({ success: false, message: 'Nama maksimal 100 karakter.' });
  }

  // 2. Validasi Email: Wajib String, Maksimal 255 Karakter (VARCHAR(255)), & Wajib berdomain @uku.co.id atau @uku.id
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email wajib diisi dan harus berupa teks (string).' });
  }
  if (email.length > 255) {
    return res.status(400).json({ success: false, message: 'Email tidak boleh lebih dari 255 karakter.' });
  }
  
  // Pembatasan registrasi agar hanya email domain internal UKu yang bisa mendaftar
  const isAllowedDomain = email.endsWith('@uku.co.id') || email.endsWith('@uku.id');
  if (!isAllowedDomain) {
    return res.status(400).json({ 
      success: false, 
      message: 'Pendaftaran dibatasi! Email harus menggunakan domain resmi UKu (@uku.co.id).' 
    });
  }

  // 3. Validasi WhatsApp: Harus String & Maksimal 20 Karakter (VARCHAR(20))
  if (whatsapp) {
    if (typeof whatsapp !== 'string') {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp harus berupa teks (string).' });
    }
    if (whatsapp.length > 20) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp maksimal 20 karakter.' });
    }
  }

  // 4. Validasi Password: Harus String & Maksimal 255 Karakter (VARCHAR(255))
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password wajib diisi.' });
  }
  if (password.length > 255) {
    return res.status(400).json({ success: false, message: 'Password terlalu panjang.' });
  }

  // Jika lolos semua validasi manual, teruskan ke proses simpan ke MySQL
  next();
};