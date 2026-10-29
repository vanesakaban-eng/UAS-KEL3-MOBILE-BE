import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export type AuthenticatedRequest = Request & { userId: number };

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
    res.status(401).json({ message: 'Token autentikasi diperlukan.' });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'uku_secret_key_2026',
    ) as JwtPayload;
    const userId = Number(payload.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({ message: 'Token autentikasi tidak valid.' });
      return;
    }
    (req as AuthenticatedRequest).userId = userId;
    next();
  } catch {
    res.status(401).json({ message: 'Token autentikasi tidak valid atau kedaluwarsa.' });
  }
}