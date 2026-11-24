"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const db_1 = __importDefault(require("../config/db"));
// 1. Mengambil semua kategori (atau berdasarkan type)
const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM categories';
        const params = [];
        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        const [rows] = await db_1.default.execute(query, params);
        return res.status(200).json({
            success: true,
            data: rows,
        });
    }
    catch (error) {
        console.error('Error get categories:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
exports.getCategories = getCategories;
// 2. Menambah kategori baru
const createCategory = async (req, res) => {
    try {
        const { name, type, icon } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi.' });
        }
        const finalIcon = icon || 'utensils';
        const [result] = await db_1.default.execute('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)', [name, type, finalIcon]);
        return res.status(201).json({
            success: true,
            message: 'Kategori berhasil ditambahkan',
            data: { id: result.insertId, name, type, icon: finalIcon },
        });
    }
    catch (error) {
        console.error('Error create category:', error);
        return res.status(500).json({ message: error.message || 'Gagal menyimpan kategori' });
    }
};
exports.createCategory = createCategory;
// 3. Mengupdate kategori berdasarkan ID
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, icon } = req.body;
        if (!name || !type) {
            return res.status(400).json({ message: 'Nama dan tipe kategori wajib diisi.' });
        }
        const finalIcon = icon || 'utensils';
        const [result] = await db_1.default.execute('UPDATE categories SET name = ?, type = ?, icon = ? WHERE id = ?', [name, type, finalIcon, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Kategori berhasil diperbarui',
            data: { id: Number(id), name, type, icon: finalIcon },
        });
    }
    catch (error) {
        console.error('Error update category:', error);
        return res.status(500).json({ message: error.message || 'Gagal memperbarui kategori' });
    }
};
exports.updateCategory = updateCategory;
// 4. Menghapus kategori berdasarkan ID
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db_1.default.execute('DELETE FROM categories WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Kategori tidak ditemukan.' });
        }
        return res.status(200).json({
            success: true,
            message: 'Kategori berhasil dihapus',
        });
    }
    catch (error) {
        console.error('Error delete category:', error);
        return res.status(500).json({ message: error.message || 'Gagal menghapus kategori' });
    }
};
exports.deleteCategory = deleteCategory;
