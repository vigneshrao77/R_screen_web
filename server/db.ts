import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Candidate,
  JobDescription,
  Screening,
  Recruiter,
  AuditLog,
  SystemSettings
} from '../src/types/index.js';

interface DatabaseSchema {
  users: Array<Recruiter & { passwordHash: string; salt: string }>;
  jobs: JobDescription[];
  candidates: Candidate[];
  screenings: Screening[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'resumes');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

const DEFAULT_AI_ENGINEER_RAW_TEXT = `AI Engineer Job Description
Position: AI Engineer
Location: Remote / Hybrid
Experience: 2-5 Years
Role Overview
We are looking for an AI Engineer to design, build, and deploy production-ready Generative AI
applications. You will work on Retrieval-Augmented Generation (RAG), LLM integrations, AI agents,
and scalable APIs.
Key Responsibilities
• Build AI applications using Python and FastAPI.
• Develop RAG pipelines with vector databases.
• Integrate OpenAI, Gemini, or Anthropic APIs.
• Build n8n automations and AI workflows.
• Work with PostgreSQL, Redis, and Docker.
• Optimize prompts and structured outputs.
• Deploy applications to cloud platforms.
• Collaborate using Git and GitHub.
Required Skills
• Python
• FastAPI / Flask
• LangChain or LlamaIndex
• OpenAI / Gemini APIs
• RAG and Vector Databases (Pinecone, Qdrant, Chroma, FAISS)
• SQL / PostgreSQL
• Docker
• Git & GitHub
• REST APIs
Preferred Skills
• n8n or workflow automation
• Kubernetes
• AWS/GCP/Azure
• CI/CD
• Prompt Engineering
• MCP and AI Agents
Education
Bachelor's degree in Computer Science, Information Technology, or equivalent practical
experience.
What We Look For
Strong problem-solving skills, excellent communication, ownership mindset, and experience
building end-to-end AI solutions.`;

const DEFAULT_JOB: JobDescription = {
  id: 'job-ai-engineer-01',
  title: 'AI Engineer',
  location: 'Remote / Hybrid',
  experienceLevel: '2-5 Years',
  roleOverview: 'We are looking for an AI Engineer to design, build, and deploy production-ready Generative AI applications. You will work on Retrieval-Augmented Generation (RAG), LLM integrations, AI agents, and scalable APIs.',
  responsibilities: [
    'Build AI applications using Python and FastAPI',
    'Develop RAG pipelines with vector databases',
    'Integrate OpenAI, Gemini, or Anthropic APIs',
    'Build n8n automations and AI workflows',
    'Work with PostgreSQL, Redis, and Docker',
    'Optimize prompts and structured outputs',
    'Deploy applications to cloud platforms',
    'Collaborate using Git and GitHub'
  ],
  requiredSkills: [
    'Python',
    'FastAPI / Flask',
    'LangChain or LlamaIndex',
    'OpenAI / Gemini APIs',
    'RAG and Vector Databases (Pinecone, Qdrant, Chroma, FAISS)',
    'SQL / PostgreSQL',
    'Docker',
    'Git & GitHub',
    'REST APIs'
  ],
  preferredSkills: [
    'n8n or workflow automation',
    'Kubernetes',
    'AWS/GCP/Azure',
    'CI/CD',
    'Prompt Engineering',
    'MCP and AI Agents'
  ],
  education: "Bachelor's degree in Computer Science, Information Technology, or equivalent practical experience.",
  whatWeLookFor: 'Strong problem-solving skills, excellent communication, ownership mindset, and experience building end-to-end AI solutions.',
  rawText: DEFAULT_AI_ENGINEER_RAW_TEXT,
  active: true,
  createdAt: new Date().toISOString()
};

function getInitialDatabase(): DatabaseSchema {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('Recruiter2026!', salt);

  return {
    users: [
      {
        id: 'usr-admin-1',
        email: 'recruiter@company.com',
        name: 'Sarah Jenkins (Lead HR)',
        role: 'admin',
        passwordHash,
        salt,
        lastLoginAt: new Date().toISOString()
      }
    ],
    jobs: [DEFAULT_JOB],
    candidates: [],
    screenings: [],
    auditLogs: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        recruiterEmail: 'system',
        action: 'SYSTEM_INITIALIZED',
        entityType: 'settings',
        entityId: 'system',
        details: 'Database initialized with default AI Engineer job profile and recruiter account'
      }
    ],
    settings: {
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
      n8nEnabled: !!process.env.N8N_WEBHOOK_URL,
      geminiModel: 'gemini-3.8-flash',
      companyName: 'Apex Human Capital Systems',
      defaultJobId: 'job-ai-engineer-01'
    }
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing fresh schema', err);
    }
    const fresh = getInitialDatabase();
    this.saveDirect(fresh);
    return fresh;
  }

  private saveDirect(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public save(): void {
    this.saveDirect(this.data);
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public verifyPassword(user: DatabaseSchema['users'][0], passwordAttempt: string): boolean {
    const attemptHash = hashPassword(passwordAttempt, user.salt);
    return attemptHash === user.passwordHash;
  }

  public updateLastLogin(userId: string): void {
    const user = this.getUserById(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.save();
    }
  }

  // Jobs
  public getJobs(): JobDescription[] {
    return this.data.jobs;
  }

  public getJobById(id: string): JobDescription | undefined {
    return this.data.jobs.find(j => j.id === id);
  }

  public addJob(job: Omit<JobDescription, 'id' | 'createdAt'>): JobDescription {
    const newJob: JobDescription = {
      ...job,
      id: `job-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.data.jobs.unshift(newJob);
    this.save();
    return newJob;
  }

  public updateJob(id: string, updates: Partial<JobDescription>): JobDescription | null {
    const idx = this.data.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.data.jobs[idx] = { ...this.data.jobs[idx], ...updates };
    this.save();
    return this.data.jobs[idx];
  }

  // Candidates
  public getCandidates(): Candidate[] {
    return this.data.candidates;
  }

  public getCandidateById(id: string): Candidate | undefined {
    return this.data.candidates.find(c => c.id === id);
  }

  public findCandidateByEmailOrPhone(email: string, phone: string): Candidate | undefined {
    return this.data.candidates.find(
      c => c.email.toLowerCase() === email.toLowerCase() || (phone && c.phone === phone)
    );
  }

  public addCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Candidate {
    const newCand: Candidate = {
      ...candidate,
      id: `cand-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.candidates.unshift(newCand);
    this.save();
    return newCand;
  }

  public updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
    const idx = this.data.candidates.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.candidates[idx] = {
      ...this.data.candidates[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.candidates[idx];
  }

  // Screenings
  public getScreenings(): Screening[] {
    return this.data.screenings;
  }

  public getScreeningById(id: string): Screening | undefined {
    return this.data.screenings.find(s => s.id === id);
  }

  public addScreening(screening: Omit<Screening, 'id' | 'createdAt' | 'retryCount'>): Screening {
    const newScreening: Screening = {
      ...screening,
      id: `scr-${crypto.randomUUID()}`,
      retryCount: 0,
      createdAt: new Date().toISOString()
    };
    this.data.screenings.unshift(newScreening);
    this.save();
    return newScreening;
  }

  public updateScreening(id: string, updates: Partial<Screening>): Screening | null {
    const idx = this.data.screenings.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.screenings[idx] = { ...this.data.screenings[idx], ...updates };
    this.save();
    return this.data.screenings[idx];
  }

  public deleteScreening(id: string): boolean {
    const idx = this.data.screenings.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.screenings.splice(idx, 1);
    this.save();
    return true;
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      ...entry,
      id: `aud-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
export { UPLOADS_DIR };
