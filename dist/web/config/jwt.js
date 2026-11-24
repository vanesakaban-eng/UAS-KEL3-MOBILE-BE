"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = void 0;
const getJwtSecret = () => process.env.JWT_SECRET || 'uku_secret_key_2026';
exports.getJwtSecret = getJwtSecret;
