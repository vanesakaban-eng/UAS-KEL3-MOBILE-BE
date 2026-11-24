"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireGuest = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const getBearerToken = (req) => {
    const [scheme, token, ...extra] = (req.get('authorization') || '').trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
        return undefined;
    }
    return token;
};
const verifyToken = (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token akses tidak ditemukan, silakan login ulang' });
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa' });
        }
        next(error);
    }
};
exports.verifyToken = verifyToken;
const requireGuest = (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
        return next();
    }
    try {
        jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
        return res.status(403).json({ success: false, message: 'Anda sudah login' });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            return next();
        }
        next(error);
    }
};
exports.requireGuest = requireGuest;
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || user.role?.toLowerCase() !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin!',
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
