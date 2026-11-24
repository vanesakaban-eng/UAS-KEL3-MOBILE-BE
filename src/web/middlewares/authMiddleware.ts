import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';


interface AuthRequest extends Request {
  user?: JwtPayload | string;
}


const getBearerToken = (req: Request): string | undefined => {
  const [scheme, token, ...extra] = (req.get('authorization') || '').trim().split(/\s+/);


  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
    return undefined;
  }


  return token;
};


export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);


  if (!token) {
    return res.status(401).json({ success: false, message: 'Token akses tidak ditemukan, silakan login ulang' });
  }


  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa' });
    }


    next(error);
  }
};


export const requireGuest = (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);


  if (!token) {
    return next();
  }


  try {
    jwt.verify(token, getJwtSecret());
    return res.status(403).json({ success: false, message: 'Anda sudah login' });
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return next();
    }


    next(error);
  }
};


export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload | undefined;


  if (!user || user.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin!',
    });
  }


  next();
};
