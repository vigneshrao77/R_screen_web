import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, UPLOADS_DIR } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { processScreening } from '../screeningPipeline.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.pdf$/i, '');
    cb(null, `${Date.now()}_${safeName.slice(0, 40)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resume files (.pdf) are supported.'));
    }
  }
});

// Protect all screening routes
router.use(authMiddleware);

// Upload and screen
router.post('/upload', upload.single('resume'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF resume file provided. Please upload a .pdf file.' });
    }

    const {
      fullName = '',
      email = '',
      phone = '',
      jobId = '',
      allowDuplicate = 'false'
    } = req.body;

    const trimmedName = fullName.trim() || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail) {
      return res.status(400).json({ error: 'Candidate email address is required.' });
    }

    // Check target job
    const targetJobId = jobId || db.getSettings().defaultJobId;
    const targetJob = db.getJobById(targetJobId) || db.getJobs()[0];
    if (!targetJob) {
      return res.status(400).json({ error: 'No active job description found to screen against.' });
    }

    // Duplicate check
    const existingCandidate = db.findCandidateByEmailOrPhone(trimmedEmail, trimmedPhone);
    if (existingCandidate && allowDuplicate !== 'true') {
      // Find if they already have a screening for this job
      const existingScreening = db.getScreenings().find(
        s => s.candidateId === existingCandidate.id && s.jobId === targetJob.id
      );

      return res.status(409).json({
        duplicate: true,
        message: `Candidate with email ${trimmedEmail} already exists.`,
        existingCandidate,
        existingScreeningId: existingScreening?.id
      });
    }

    // Create or use candidate
    let candidate = existingCandidate;
    if (!candidate) {
      candidate = db.addCandidate({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone || 'Not provided',
        resumeFilename: req.file.filename,
        resumePath: req.file.path,
        fileSize: req.file.size,
        extractedTextLength: 0
      });
    } else {
      // Update candidate file
      candidate = db.updateCandidate(candidate.id, {
        fullName: trimmedName || candidate.fullName,
        resumeFilename: req.file.filename,
        resumePath: req.file.path,
        fileSize: req.file.size
      })!;
    }

    // Create screening record
    const screening = db.addScreening({
      candidateId: candidate.id,
      candidate,
      jobId: targetJob.id,
      jobTitle: targetJob.title,
      status: 'pending',
      statusMessage: 'Screening queued...',
      error: null,
      result: null,
      n8nExecution: null,
      recruiterId: req.user!.id,
      recruiterEmail: req.user!.email,
      completedAt: null
    });

    db.addAuditLog({
      recruiterEmail: req.user!.email,
      action: 'RESUME_UPLOADED',
      entityType: 'screening',
      entityId: screening.id,
      details: `Uploaded resume ${req.file.originalname} for candidate ${candidate.fullName} targeting ${targetJob.title}`
    });

    // Execute the screening pipeline synchronously to return result immediately
    const processed = await processScreening(screening.id, req.user!.email);

    return res.status(201).json(processed);
  } catch (err: any) {
    console.error('Upload screening error:', err);
    return res.status(500).json({ error: err.message || 'Screening processing failed' });
  }
});

// List screenings with search & filter
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const {
    search = '',
    jobId = '',
    recommendation = '',
    riskScore = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query as Record<string, string>;

  let list = db.getScreenings();

  // Populate candidate details if missing
  list = list.map(s => {
    if (!s.candidate) {
      const c = db.getCandidateById(s.candidateId);
      if (c) s.candidate = c;
    }
    return s;
  });

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => {
      const name = s.candidate?.fullName?.toLowerCase() || '';
      const email = s.candidate?.email?.toLowerCase() || '';
      const summary = s.result?.candidate_summary?.toLowerCase() || '';
      const skills = (s.result?.matched_skills || []).join(' ').toLowerCase();
      return name.includes(q) || email.includes(q) || summary.includes(q) || skills.includes(q);
    });
  }

  if (jobId) {
    list = list.filter(s => s.jobId === jobId);
  }

  if (recommendation) {
    list = list.filter(s => s.result?.recommendation === recommendation);
  }

  if (riskScore) {
    list = list.filter(s => s.result?.risk_assessment?.risk_score === riskScore);
  }

  if (status) {
    list = list.filter(s => s.status === status);
  }

  // Sorting
  list.sort((a, b) => {
    let valA: any = a.createdAt;
    let valB: any = b.createdAt;

    if (sortBy === 'atsScore') {
      valA = a.result?.ats_score ?? -1;
      valB = b.result?.ats_score ?? -1;
    } else if (sortBy === 'fitRating') {
      valA = a.result?.overall_fit_rating ?? -1;
      valB = b.result?.overall_fit_rating ?? -1;
    } else if (sortBy === 'name') {
      valA = a.candidate?.fullName?.toLowerCase() || '';
      valB = b.candidate?.fullName?.toLowerCase() || '';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return res.json(list);
});

// Single screening detail
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const screening = db.getScreeningById(req.params.id);
  if (!screening) {
    return res.status(404).json({ error: 'Screening record not found.' });
  }

  if (!screening.candidate) {
    screening.candidate = db.getCandidateById(screening.candidateId)!;
  }

  const job = db.getJobById(screening.jobId);

  return res.json({
    ...screening,
    job
  });
});

// Retry failed or re-screen candidate
router.post('/:id/retry', async (req: AuthenticatedRequest, res: Response) => {
  const screening = db.getScreeningById(req.params.id);
  if (!screening) {
    return res.status(404).json({ error: 'Screening not found' });
  }

  db.addAuditLog({
    recruiterEmail: req.user!.email,
    action: 'SCREENING_RETRY_INITIATED',
    entityType: 'screening',
    entityId: screening.id,
    details: `Initiated retry for screening of candidate ${screening.candidate?.fullName || screening.candidateId}`
  });

  try {
    const updated = await processScreening(screening.id, req.user!.email);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Retry failed' });
  }
});

// Download / View original PDF resume
router.get('/:id/resume', (req: AuthenticatedRequest, res: Response) => {
  const screening = db.getScreeningById(req.params.id);
  if (!screening) {
    return res.status(404).json({ error: 'Screening record not found' });
  }

  const candidate = db.getCandidateById(screening.candidateId);
  if (!candidate || !candidate.resumeFilename) {
    return res.status(404).json({ error: 'Resume file not found for this candidate' });
  }

  const filePath = path.join(UPLOADS_DIR, candidate.resumeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Resume file does not exist on disk' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${candidate.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf"`);
  
  const stream = fs.createReadStream(filePath);
  return stream.pipe(res);
});

// Delete screening
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const screening = db.getScreeningById(req.params.id);
  if (!screening) {
    return res.status(404).json({ error: 'Screening record not found' });
  }

  db.deleteScreening(req.params.id);

  db.addAuditLog({
    recruiterEmail: req.user!.email,
    action: 'SCREENING_DELETED',
    entityType: 'screening',
    entityId: req.params.id,
    details: `Deleted screening for candidate ${screening.candidate?.fullName || screening.candidateId}`
  });

  return res.json({ success: true });
});

export default router;
