import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { DashboardStats } from '../../src/types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const screenings = db.getScreenings().map(s => {
    if (!s.candidate) {
      const c = db.getCandidateById(s.candidateId);
      if (c) s.candidate = c;
    }
    return s;
  });

  const total = screenings.length;
  const completed = screenings.filter(s => s.status === 'completed');
  const failed = screenings.filter(s => s.status === 'failed');
  const inProgress = screenings.filter(s => ['pending', 'extracting', 'n8n_triggered', 'ai_evaluating'].includes(s.status));

  let strongHireCount = 0;
  let shortlistCount = 0;
  let considerCount = 0;
  let rejectCount = 0;
  let totalAtsScore = 0;
  let totalFitRating = 0;

  for (const s of completed) {
    if (!s.result) continue;
    if (s.result.recommendation === 'Strong Hire') strongHireCount++;
    else if (s.result.recommendation === 'Shortlist') shortlistCount++;
    else if (s.result.recommendation === 'Consider') considerCount++;
    else if (s.result.recommendation === 'Reject') rejectCount++;

    totalAtsScore += s.result.ats_score || 0;
    totalFitRating += s.result.overall_fit_rating || 0;
  }

  const completedCount = completed.length;
  const avgAts = completedCount > 0 ? Math.round(totalAtsScore / completedCount) : 0;
  const avgFit = completedCount > 0 ? Number((totalFitRating / completedCount).toFixed(1)) : 0;

  const stats: DashboardStats = {
    totalScreenings: total,
    completedScreenings: completedCount,
    failedScreenings: failed.length,
    inProgressScreenings: inProgress.length,
    strongHireCount,
    shortlistCount,
    considerCount,
    rejectCount,
    averageAtsScore: avgAts,
    averageFitRating: avgFit,
    recentScreenings: screenings.slice(0, 10)
  };

  return res.json(stats);
});

export default router;
