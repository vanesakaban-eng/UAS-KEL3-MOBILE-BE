import { Request, Response } from 'express';
import db from '../config/db';

// 1. Mengambil semua kategori (atau berdasarkan type)
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    const [rows] = await db.execute(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    console.error('Error get categories:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// 2. Menambah kategori baru
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, type, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi.' });
    }

    const finalIcon = icon || 'utensils';
    const [result]: any = await db.execute(
      'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)',
      [name, type, finalIcon]
    );

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      data: { id: result.insertId, name, type, icon: finalIcon },
    });
  } catch (error: any) {
    console.error('Error create category:', error);
    return res.status(500).json({ message: error.message || 'Gagal menyimpan kategori' });
  }
};

// 3. Mengupdate kategori berdasarkan ID
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi.' });
    }

    const finalIcon = icon || 'utensils';
    const [result]: any = await db.execute(
      'UPDATE categories SET name = ?, type = ?, icon = ? WHERE id = ?',
      [name, type, finalIcon, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil diperbarui',
      data: { id: Number(id), name, type, icon: finalIcon },
    });
  } catch (error: any) {
    console.error('Error update category:', error);
    return res.status(500).json({ message: error.message || 'Gagal memperbarui kategori' });
  }
};

// 4. Menghapus kategori berdasarkan ID
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result]: any = await db.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Kategori berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error delete category:', error);
    return res.status(500).json({ message: error.message || 'Gagal menghapus kategori' });
  }
};