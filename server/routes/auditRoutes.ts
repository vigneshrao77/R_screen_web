import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs(150);
  return res.json(logs);
});

export default router;
