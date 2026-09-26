import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { createSession, revokeSession, AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await db.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await db.updateLastLogin(user.id);
    const token = createSession(user.id);

    await db.addAuditLog({
      recruiterEmail: user.email,
      action: 'RECRUITER_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      details: `Recruiter ${user.name} logged into screening portal`
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.slice(7);
    if (token) {
      revokeSession(token);
    }

    if (req.user) {
      await db.addAuditLog({
        recruiterEmail: req.user.email,
        action: 'RECRUITER_LOGOUT',
        entityType: 'auth',
        entityId: req.user.id,
        details: `Recruiter ${req.user.name} logged out`
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
