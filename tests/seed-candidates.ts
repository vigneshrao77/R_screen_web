import { db, connectDB } from '../server/db.js';
import { processScreening } from '../server/screeningPipeline.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function seedRealCandidates() {
  console.log('Seeding initial candidates with real Gemini evaluations...');
  await connectDB();
  const user = (await db.getUserByEmail('recruiter@company.com'))!;
  const jobs = await db.getJobs();
  const job = jobs[0];

  const candidatesData = [
    {
      name: 'David Chen',
      email: 'david.chen.ai@example.com',
      phone: '+1 (650) 432-8899',
      pdf: `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
4 0 obj << /Length 750 >> stream
BT
/F1 12 Tf
40 750 Td (David Chen - Senior Generative AI Engineer) Tj
40 730 Td (Email: david.chen.ai@example.com | Phone: +1 650 432 8899 | San Francisco, CA) Tj
40 700 Td (SUMMARY: AI Engineer with 4 years experience building production LLM apps and RAG systems.) Tj
40 680 Td (EXPERIENCE:) Tj
40 660 Td (- Senior AI Engineer at Synthetix Labs (2023-Present): Built RAG pipelines with Pinecone, Qdrant.) Tj
40 640 Td (- Deployed FastAPI microservices with Gemini and OpenAI APIs, LangChain, and Redis caching.) Tj
40 620 Td (- Created automated n8n workflows for data extraction and structured outputs.) Tj
40 600 Td (- Managed PostgreSQL vector stores and containerized deployment with Docker and Kubernetes on GCP.) Tj
40 580 Td (SKILLS: Python, FastAPI, LangChain, Gemini API, OpenAI, Pinecone, Qdrant, PostgreSQL, Docker, Git, CI/CD, n8n, MCP) Tj
40 560 Td (EDUCATION: B.S. in Computer Science from UC Berkeley) Tj
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
980
%%EOF`
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (206) 555-0192',
      pdf: `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
4 0 obj << /Length 680 >> stream
BT
/F1 12 Tf
40 750 Td (Elena Rostova - Python Backend Developer) Tj
40 730 Td (Email: elena.rostova@example.com | Phone: +1 206 555 0192 | Seattle, WA) Tj
40 700 Td (SUMMARY: Backend Developer with 2.5 years experience in Python, Flask, and SQL databases.) Tj
40 680 Td (EXPERIENCE:) Tj
40 660 Td (- Software Engineer at CloudGrid: Built REST APIs in Flask and Python, used PostgreSQL and Redis.) Tj
40 640 Td (- Integrated OpenAI API for customer service summarization.) Tj
40 620 Td (- Worked with Git, Docker, and Linux environments. Exploring LangChain.) Tj
40 600 Td (SKILLS: Python, Flask, SQL, PostgreSQL, REST APIs, Git, Docker, OpenAI API. Limited RAG experience.) Tj
40 580 Td (EDUCATION: B.S. in Information Systems, University of Washington) Tj
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
940
%%EOF`
    }
  ];

  for (const c of candidatesData) {
    if (await db.findCandidateByEmailOrPhone(c.email, c.phone)) {
      console.log(`Candidate ${c.name} already in DB`);
      continue;
    }

    const filename = `${c.name.replace(/\s+/g, '_')}_Resume.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'resumes', filename);
    fs.writeFileSync(filePath, Buffer.from(c.pdf));

    const candidate = await db.addCandidate({
      fullName: c.name,
      email: c.email,
      phone: c.phone,
      resumeFilename: filename,
      resumePath: filePath,
      fileSize: c.pdf.length,
      extractedTextLength: 0
    });

    const screening = await db.addScreening({
      candidateId: candidate.id,
      candidate,
      jobId: job.id,
      jobTitle: job.title,
      status: 'pending',
      statusMessage: 'Screening initiated',
      error: null,
      result: null,
      n8nExecution: null,
      recruiterId: user.id,
      recruiterEmail: user.email,
      completedAt: null
    });

    console.log(`Processing screening for ${c.name}...`);
    await processScreening(screening.id, user.email);
    console.log(`✓ Processed ${c.name}`);
  }
  process.exit(0);
}

seedRealCandidates().catch(console.error);
