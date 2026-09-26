import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { User, IUser } from './models/User.js';
import { Job, IJob } from './models/Job.js';
import { Candidate, ICandidate } from './models/Candidate.js';
import { Screening, IScreening } from './models/Screening.js';
import { AuditLog, IAuditLog } from './models/AuditLog.js';
import { Settings, ISettings } from './models/Settings.js';
import { JobDescription } from '../src/types/index.js';
import bcrypt from 'bcryptjs';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing from environment variables');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[MongoDB] Connected successfully');
    await seedDatabase();
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}

async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[MongoDB] Seeding default admin user...');
    const admin = new User({
      email: 'recruiter@company.com',
      name: 'Sarah Jenkins (Lead HR)',
      role: 'admin',
      passwordHash: 'Recruiter2026!' // Will be hashed by pre-save hook
    });
    await admin.save();

    await AuditLog.create({
      recruiterEmail: 'system',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'auth',
      entityId: admin.id,
      details: 'Database initialized with default recruiter account'
    });
  }

  const jobCount = await Job.countDocuments();
  if (jobCount === 0) {
    console.log('[MongoDB] Seeding default job...');
    const DEFAULT_AI_ENGINEER_RAW_TEXT = `AI Engineer Job Description\nPosition: AI Engineer\nLocation: Remote / Hybrid\nExperience: 2-5 Years\nRole Overview\nWe are looking for an AI Engineer to design, build, and deploy production-ready Generative AI applications.`;
    const defaultJob = new Job({
      title: 'AI Engineer',
      location: 'Remote / Hybrid',
      experienceLevel: '2-5 Years',
      roleOverview: 'We are looking for an AI Engineer to design, build, and deploy production-ready Generative AI applications. You will work on Retrieval-Augmented Generation (RAG), LLM integrations, AI agents, and scalable APIs.',
      responsibilities: ['Build AI applications using Python and FastAPI', 'Develop RAG pipelines with vector databases', 'Integrate OpenAI, Gemini, or Anthropic APIs'],
      requiredSkills: ['Python', 'FastAPI / Flask', 'LangChain or LlamaIndex', 'OpenAI / Gemini APIs'],
      preferredSkills: ['n8n or workflow automation', 'Kubernetes'],
      education: "Bachelor's degree in Computer Science",
      whatWeLookFor: 'Strong problem-solving skills',
      rawText: DEFAULT_AI_ENGINEER_RAW_TEXT,
      active: true
    });
    await defaultJob.save();
  }

  const settingsCount = await Settings.countDocuments();
  if (settingsCount === 0) {
    console.log('[MongoDB] Seeding default settings...');
    const defaultJob = await Job.findOne();
    await Settings.create({
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
      n8nEnabled: !!process.env.N8N_WEBHOOK_URL,
      geminiModel: 'gemini-3.8-flash',
      companyName: 'Apex Human Capital Systems',
      defaultJobId: defaultJob ? defaultJob.id : ''
    });
  }
}

class Database {
  // Users
  public async getUsers() {
    return User.find().lean();
  }

  public async getUserByEmail(email: string) {
    return User.findOne({ email }).lean();
  }

  public async getUserById(id: string) {
    return User.findById(id).lean();
  }

  public async verifyPassword(user: any, passwordAttempt: string): Promise<boolean> {
    const userDoc = await User.findById(user.id || user._id);
    if (!userDoc) return false;
    return userDoc.comparePassword(passwordAttempt);
  }

  public async updateLastLogin(userId: string) {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  // Jobs
  public async getJobs() {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return jobs.map(j => j.toJSON());
  }

  public async getJobById(id: string) {
    const job = await Job.findById(id);
    return job ? job.toJSON() : undefined;
  }

  public async addJob(job: any) {
    const newJob = new Job(job);
    await newJob.save();
    return newJob.toJSON();
  }

  public async updateJob(id: string, updates: any) {
    const job = await Job.findByIdAndUpdate(id, updates, { new: true });
    return job ? job.toJSON() : null;
  }

  // Candidates
  public async getCandidates() {
    const cands = await Candidate.find().sort({ createdAt: -1 });
    return cands.map(c => c.toJSON());
  }

  public async getCandidateById(id: string) {
    const cand = await Candidate.findById(id);
    return cand ? cand.toJSON() : undefined;
  }

  public async findCandidateByEmailOrPhone(email: string, phone: string) {
    const cand = await Candidate.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    return cand ? cand.toJSON() : undefined;
  }

  public async addCandidate(candidate: any) {
    const newCand = new Candidate(candidate);
    await newCand.save();
    return newCand.toJSON();
  }

  public async updateCandidate(id: string, updates: any) {
    const cand = await Candidate.findByIdAndUpdate(id, updates, { new: true });
    return cand ? cand.toJSON() : null;
  }

  // Screenings
  public async getScreenings() {
    const scr = await Screening.find().populate('candidate').sort({ createdAt: -1 });
    return scr.map(s => s.toJSON());
  }

  public async getScreeningById(id: string) {
    const scr = await Screening.findById(id).populate('candidate');
    return scr ? scr.toJSON() : undefined;
  }

  public async addScreening(screening: any) {
    const newScr = new Screening(screening);
    await newScr.save();
    await newScr.populate('candidate');
    return newScr.toJSON();
  }

  public async updateScreening(id: string, updates: any) {
    const scr = await Screening.findByIdAndUpdate(id, updates, { new: true }).populate('candidate');
    return scr ? scr.toJSON() : null;
  }

  public async deleteScreening(id: string) {
    const res = await Screening.findByIdAndDelete(id);
    return !!res;
  }

  // Audit Logs
  public async addAuditLog(entry: any) {
    await AuditLog.create(entry);
  }

  public async getAuditLogs(limit = 100) {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    return logs.map(l => l.toJSON());
  }

  // Settings
  public async getSettings() {
    const set = await Settings.findOne();
    return set ? set.toJSON() : null;
  }

  public async updateSettings(updates: any) {
    let set = await Settings.findOne();
    if (set) {
      Object.assign(set, updates);
      await set.save();
    } else {
      set = await Settings.create(updates);
    }
    return set.toJSON();
  }
}

export const db = new Database();
export { UPLOADS_DIR };
