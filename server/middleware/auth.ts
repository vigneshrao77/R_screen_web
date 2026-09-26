import { Request, Response, NextFunction } from 'express';
import { db } from '../db.js';
import { Recruiter } from '../../src/types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: Recruiter;
}

// In-memory sessions mapped to tokens
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export function createSession(userId: string): string {
  const token = `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  // 7 days expiration
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

export function revokeSession(token: string): void {
  sessions.delete(token);
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.query.token as string | undefined);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  try {
    const user = await db.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = {
      id: user._id ? user._id.toString() : (user.id || ''),
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication service error.' });
  }
}
