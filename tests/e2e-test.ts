import { db } from '../server/db.js';
import { extractTextFromPdf } from '../server/pdfService.js';
import { evaluateResumeWithGemini } from '../server/gemini.js';
import { processScreening } from '../server/screeningPipeline.js';
import fs from 'fs';
import path from 'path';

async function runEndToEndTests() {
  console.log('=== STARTING AUTOMATED RESUME SCREENING E2E VERIFICATION ===\n');

  // Test 1: Verify Seed Database & Recruiter Auth
  console.log('Step 1: Testing Recruiter Authentication & Database state...');
  const user = db.getUserByEmail('recruiter@company.com');
  if (!user) throw new Error('Default recruiter user not found in DB');
  const validPass = db.verifyPassword(user, 'Recruiter2026!');
  if (!validPass) throw new Error('Password verification failed for recruiter');
  console.log('✓ Recruiter authentication verified.');

  // Test 2: Verify Job Description criteria
  console.log('\nStep 2: Checking Job Description benchmarks...');
  const jobs = db.getJobs();
  if (jobs.length === 0) throw new Error('No jobs found in DB');
  const aiJob = jobs[0];
  console.log(`✓ Active target job: "${aiJob.title}" with ${aiJob.requiredSkills.length} required skills.`);

  // Test 3: Create a real PDF Resume
  console.log('\nStep 3: Creating and testing PDF Resume text extraction...');
  const testCandidateName = 'Jordan Rivera';
  const testEmail = `jordan.rivera.${Date.now()}@example.com`;
  const testPhone = '+1 (415) 789-9922';

  const pdfRaw = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
4 0 obj << /Length 580 >> stream
BT
/F1 12 Tf
40 750 Td (Jordan Rivera - Senior AI & Systems Engineer) Tj
40 730 Td (Email: ${testEmail} | Phone: ${testPhone} | San Francisco, CA) Tj
40 700 Td (SUMMARY: AI Engineer with 3.5 years experience building production LLMs, RAG, and FastAPI microservices.) Tj
40 680 Td (EXPERIENCE:) Tj
40 660 Td (- Senior AI Engineer at NeuralCraft (2022-Present): Designed RAG pipelines with Pinecone and Gemini.) Tj
40 640 Td (- Built scalable FastAPI microservices with Docker, PostgreSQL, and Redis caching.) Tj
40 620 Td (- Automated workflow pipelines with n8n and MCP integrations for candidate processing.) Tj
40 600 Td (SKILLS: Python, FastAPI, Gemini API, LangChain, Pinecone, PostgreSQL, Docker, Git, CI/CD, n8n, Redis) Tj
40 580 Td (EDUCATION: B.S. in Computer Science, Stanford University) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000280 00000 n 
0000000214 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
900
%%EOF`;

  const pdfBuffer = Buffer.from(pdfRaw);
  const extractedText = await extractTextFromPdf(pdfBuffer);
  console.log(`✓ PDF text extracted successfully (${extractedText.length} characters). Snippet: "${extractedText.slice(0, 60)}..."`);
  if (!extractedText.toLowerCase().includes('jordan rivera')) {
    throw new Error('Extracted text does not contain candidate name');
  }

  // Test 4: Save Candidate & Screening in Database
  console.log('\nStep 4: Registering candidate and screening in DB...');
  const resumeFilename = `test_${Date.now()}_jordan.pdf`;
  const uploadPath = path.join(process.cwd(), 'uploads', 'resumes', resumeFilename);
  fs.writeFileSync(uploadPath, pdfBuffer);

  const candidate = db.addCandidate({
    fullName: testCandidateName,
    email: testEmail,
    phone: testPhone,
    resumeFilename,
    resumePath: uploadPath,
    fileSize: pdfBuffer.length,
    extractedTextLength: extractedText.length
  });

  const screening = db.addScreening({
    candidateId: candidate.id,
    candidate,
    jobId: aiJob.id,
    jobTitle: aiJob.title,
    status: 'pending',
    statusMessage: 'Queued for screening',
    error: null,
    result: null,
    n8nExecution: null,
    recruiterId: user.id,
    recruiterEmail: user.email,
    completedAt: null
  });
  console.log(`✓ Candidate ID: ${candidate.id}, Screening ID: ${screening.id}`);

  // Test 5: Execute Complete Screening Pipeline (PDF extraction → n8n trigger → Gemini AI → Structured Output → DB save)
  console.log('\nStep 5: Executing full screening pipeline with Gemini AI Agent...');
  const processed = await processScreening(screening.id, user.email);

  console.log(`✓ Screening Status: ${processed.status}`);
  if (processed.status !== 'completed') {
    throw new Error(`Screening failed: ${processed.error}`);
  }

  const res = processed.result!;
  console.log('\n--- VERIFYING STRUCTURED OUTPUT PARSER FIELDS ---');
  console.log(`Candidate Name: ${res.candidate_name}`);
  console.log(`Job Title: ${res.job_title}`);
  console.log(`Recommendation: ${res.recommendation}`);
  console.log(`ATS Score: ${res.ats_score}/100`);
  console.log(`Overall Fit Rating: ${res.overall_fit_rating}/10`);
  console.log(`Risk Score: ${res.risk_assessment?.risk_score} (Reason: ${res.risk_assessment?.reason.slice(0, 60)}...)`);
  console.log(`Reward Score: ${res.reward_assessment?.reward_score}`);
  console.log(`Matched Skills (${res.matched_skills?.length}): ${res.matched_skills?.join(', ')}`);
  console.log(`Missing Skills (${res.missing_skills?.length}): ${res.missing_skills?.join(', ') || 'None'}`);
  console.log(`Interview Questions (${res.interview_questions?.length}):`);
  res.interview_questions?.forEach((q, idx) => console.log(`   ${idx + 1}. ${q}`));

  // Assertions on the 17 fields
  if (!res.candidate_name) throw new Error('Missing candidate_name');
  if (!res.job_title) throw new Error('Missing job_title');
  if (!res.candidate_summary) throw new Error('Missing candidate_summary');
  if (!Array.isArray(res.matched_skills)) throw new Error('matched_skills is not an array');
  if (!Array.isArray(res.missing_skills)) throw new Error('missing_skills is not an array');
  if (!Array.isArray(res.additional_skills)) throw new Error('additional_skills is not an array');
  if (!Array.isArray(res.strengths)) throw new Error('strengths is not an array');
  if (!Array.isArray(res.weaknesses)) throw new Error('weaknesses is not an array');
  if (!res.experience_match) throw new Error('Missing experience_match');
  if (!res.education_match) throw new Error('Missing education_match');
  if (!res.risk_assessment?.risk_score) throw new Error('Missing risk_assessment.risk_score');
  if (!res.reward_assessment?.reward_score) throw new Error('Missing reward_assessment.reward_score');
  if (typeof res.overall_fit_rating !== 'number') throw new Error('overall_fit_rating is not a number');
  if (typeof res.ats_score !== 'number') throw new Error('ats_score is not a number');
  if (!['Reject', 'Consider', 'Shortlist', 'Strong Hire'].includes(res.recommendation)) {
    throw new Error(`Invalid recommendation: ${res.recommendation}`);
  }
  if (!Array.isArray(res.interview_questions) || res.interview_questions.length === 0) {
    throw new Error('interview_questions is empty');
  }
  if (!res.justification) throw new Error('Missing justification');

  console.log('✓ All 17 Structured Output Parser fields verified successfully.');

  // Test 6: Verify Duplicate Detection
  console.log('\nStep 6: Testing duplicate candidate protection...');
  const duplicate = db.findCandidateByEmailOrPhone(testEmail, testPhone);
  if (!duplicate) throw new Error('Duplicate check failed: candidate should exist');
  console.log(`✓ Duplicate successfully caught for email: ${testEmail}`);

  // Test 7: Verify Retry Capability
  console.log('\nStep 7: Testing 1-click retry mechanism...');
  const retried = await processScreening(screening.id, user.email);
  if (retried.status !== 'completed') {
    throw new Error('Retry failed');
  }
  console.log('✓ Retry completed successfully.');

  // Test 8: Verify Audit Logging
  console.log('\nStep 8: Checking compliance audit trail...');
  const logs = db.getAuditLogs(20);
  const relevantLogs = logs.filter(l => l.entityId === screening.id);
  console.log(`✓ Found ${relevantLogs.length} audit trail records for screening ${screening.id}`);

  console.log('\n=== ALL END-TO-END CRITICAL TESTS PASSED! ===');
}

runEndToEndTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
