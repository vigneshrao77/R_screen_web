import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (_req: AuthenticatedRequest, res: Response) => {
  const jobs = db.getJobs();
  return res.json(jobs);
});

router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const job = db.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job description not found' });
  }
  return res.json(job);
});

router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    location = 'Remote / Hybrid',
    experienceLevel = '2-5 Years',
    roleOverview = '',
    responsibilities = [],
    requiredSkills = [],
    preferredSkills = [],
    education = '',
    whatWeLookFor = '',
    rawText = '',
    active = true
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Job title is required.' });
  }

  // Construct raw text if not provided
  let constructedRawText = rawText;
  if (!constructedRawText) {
    constructedRawText = `${title} Job Description\nPosition: ${title}\nLocation: ${location}\nExperience: ${experienceLevel}\n\nRole Overview:\n${roleOverview}\n\nKey Responsibilities:\n${responsibilities.map((r: string) => `• ${r}`).join('\n')}\n\nRequired Skills:\n${requiredSkills.map((s: string) => `• ${s}`).join('\n')}\n\nPreferred Skills:\n${preferredSkills.map((s: string) => `• ${s}`).join('\n')}\n\nEducation:\n${education}\n\nWhat We Look For:\n${whatWeLookFor}`;
  }

  const job = db.addJob({
    title,
    location,
    experienceLevel,
    roleOverview,
    responsibilities,
    requiredSkills,
    preferredSkills,
    education,
    whatWeLookFor,
    rawText: constructedRawText,
    active
  });

  db.addAuditLog({
    recruiterEmail: req.user!.email,
    action: 'JOB_CREATED',
    entityType: 'job',
    entityId: job.id,
    details: `Created job screening benchmark for role: ${job.title}`
  });

  return res.status(201).json(job);
});

router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateJob(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Job description not found' });
  }

  db.addAuditLog({
    recruiterEmail: req.user!.email,
    action: 'JOB_UPDATED',
    entityType: 'job',
    entityId: updated.id,
    details: `Updated job screening requirements for: ${updated.title}`
  });

  return res.json(updated);
});

export default router;
