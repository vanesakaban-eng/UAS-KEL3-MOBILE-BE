import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export type UserRole = 'admin' | 'user';

export type AuthenticatedRequest = Request & {
  userId: number;
  userEmail: string;
  userRole: UserRole;
};

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: 'Token autentikasi diperlukan.' });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'uku_secret_key_2026_default',
    ) as JwtPayload;

    const userId = Number(payload.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({ success: false, message: 'Token autentikasi tidak valid.' });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    authReq.userId = userId;
    authReq.userEmail = String(payload.email || '');
    authReq.userRole = (String(payload.role || '').toLowerCase() === 'admin' ? 'admin' : 'user') as UserRole;

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token autentikasi tidak valid atau kedaluwarsa.' });
  }
}

/**
 * Middleware Role-Based Access Control (RBAC)
 * Memastikan pengguna memiliki salah satu role yang diizinkan.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      res.status(401).json({ success: false, message: 'Pengguna belum terautentikasi.' });
      return;
    }

    if (!allowedRoles.includes(authReq.userRole)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Endpoint ini hanya dapat diakses oleh peran: [${allowedRoles.join(', ')}]. Peran Anda saat ini: ${authReq.userRole}`,
      });
      return;
    }

    next();
  };
}
