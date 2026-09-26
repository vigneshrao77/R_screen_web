import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { Recruiter } from '../../src/types/index.js';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: Recruiter;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export function createSession(userId: string): string {
  // 7 days expiration
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function revokeSession(token: string): void {
  // Stateless JWTs cannot be easily revoked without a blacklist or DB update.
  // The client will remove the token from localStorage.
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.query.token as string | undefined);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await db.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = {
      id: user.id || (user as any)._id?.toString() || '',
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : new Date().toISOString()
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
}
