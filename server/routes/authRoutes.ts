import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { createSession, revokeSession, AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isValid = db.verifyPassword(user, password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  db.updateLastLogin(user.id);
  const token = createSession(user.id);

  db.addAuditLog({
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
});

router.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7);
  if (token) {
    revokeSession(token);
  }

  if (req.user) {
    db.addAuditLog({
      recruiterEmail: req.user.email,
      action: 'RECRUITER_LOGOUT',
      entityType: 'auth',
      entityId: req.user.id,
      details: `Recruiter ${req.user.name} logged out`
    });
  }

  return res.json({ success: true });
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
