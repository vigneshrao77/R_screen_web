import fs from 'fs';
import path from 'path';
import { db, UPLOADS_DIR } from './db.js';
import { extractTextFromPdf } from './pdfService.js';
import { evaluateResumeWithGemini } from './gemini.js';
import { triggerN8nWorkflow } from './n8nService.js';
import { Screening, Candidate } from '../src/types/index.js';

export interface ExecuteScreeningInput {
  screeningId: string;
  recruiterEmail: string;
}

export async function processScreening(screeningId: string, recruiterEmail: string): Promise<Screening> {
  const screening = await db.getScreeningById(screeningId);
  if (!screening) {
    throw new Error(`Screening ${screeningId} not found`);
  }

  const job = await db.getJobById(String(screening.jobId));
  if (!job) {
    throw new Error(`Associated job ${screening.jobId} not found`);
  }

  const candidate = await db.getCandidateById(String(screening.candidateId));
  if (!candidate) {
    throw new Error(`Candidate ${screening.candidateId} not found`);
  }

  // Update status to extracting
  await db.updateScreening(screeningId, {
    status: 'extracting',
    statusMessage: 'Extracting text and structure from PDF resume...',
    error: null
  });

  try {
    const resumeFilePath = path.join(UPLOADS_DIR, candidate.resumeFilename);
    if (!fs.existsSync(resumeFilePath)) {
      throw new Error(`Resume file not found at ${resumeFilePath}`);
    }

    const pdfBuffer = fs.readFileSync(resumeFilePath);

    // 1. Text extraction
    console.log(`[Screening Pipeline] Extracting text for ${candidate.fullName}...`);
    const extractedText = await extractTextFromPdf(pdfBuffer);

    await db.updateCandidate(candidate.id || (candidate as any)._id?.toString(), {
      extractedTextLength: extractedText.length
    });

    // 2. n8n workflow trigger
    await db.updateScreening(screeningId, {
      status: 'n8n_triggered',
      statusMessage: 'Triggering n8n workflow webhook for automated notifications & Notion sync...'
    });

    const n8nRecord = await triggerN8nWorkflow({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      resumeBuffer: pdfBuffer,
      resumeFilename: candidate.resumeFilename
    });

    // 3. Gemini AI structured evaluation
    await db.updateScreening(screeningId, {
      status: 'ai_evaluating',
      statusMessage: 'Screening candidate against job criteria with Gemini AI Agent...',
      n8nExecution: n8nRecord
    });

    console.log(`[Screening Pipeline] Evaluating candidate against ${job.title}...`);
    const structuredResult = await evaluateResumeWithGemini(extractedText, job.rawText);

    // Overwrite candidate name if extracted candidate name is empty or default
    if (!structuredResult.candidate_name || structuredResult.candidate_name === 'Candidate') {
      structuredResult.candidate_name = candidate.fullName;
    }

    // 4. Save completed result
    const completedAt = new Date().toISOString();
    const updated = await db.updateScreening(screeningId, {
      status: 'completed',
      statusMessage: 'AI screening complete and candidate report generated.',
      result: structuredResult,
      completedAt,
      error: null
    });

    // Audit log
    await db.addAuditLog({
      recruiterEmail,
      action: 'SCREENING_COMPLETED',
      entityType: 'screening',
      entityId: screeningId,
      details: `Screened candidate ${candidate.fullName} for role ${job.title}. Result: ${structuredResult.recommendation}, ATS: ${structuredResult.ats_score}/100, Fit: ${structuredResult.overall_fit_rating}/10.`
    });

    return updated as any;
  } catch (err: any) {
    console.error(`[Screening Pipeline] Error processing ${screeningId}:`, err);
    const updated = await db.updateScreening(screeningId, {
      status: 'failed',
      statusMessage: 'Screening failed',
      error: err.message || 'Unknown processing error',
      retryCount: screening.retryCount + 1
    });

    await db.addAuditLog({
      recruiterEmail,
      action: 'SCREENING_FAILED',
      entityType: 'screening',
      entityId: screeningId,
      details: `Screening failed for candidate ${candidate.fullName}: ${err.message}`
    });

    return updated as any;
  }
}
