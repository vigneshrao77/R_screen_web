export type RecommendationType = 'Strong Hire' | 'Shortlist' | 'Consider' | 'Reject';
export type RiskScoreType = 'Low' | 'Medium' | 'High';
export type RewardScoreType = 'Low' | 'Medium' | 'High';

export type ScreeningStatus = 
  | 'pending'
  | 'extracting'
  | 'n8n_triggered'
  | 'ai_evaluating'
  | 'completed'
  | 'failed';

export interface StructuredScreeningResult {
  candidate_name: string;
  job_title: string;
  candidate_summary: string;
  matched_skills: string[];
  missing_skills: string[];
  additional_skills: string[];
  strengths: string[];
  weaknesses: string[];
  experience_match: string;
  education_match: string;
  risk_assessment: {
    risk_score: RiskScoreType;
    reason: string;
  };
  reward_assessment: {
    reward_score: RewardScoreType;
    reason: string;
  };
  overall_fit_rating: number; // 0 to 10
  ats_score: number; // 0 to 100
  recommendation: RecommendationType;
  interview_questions: string[];
  justification: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  resumeFilename: string;
  resumePath: string;
  fileSize: number;
  extractedTextLength: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobDescription {
  id: string;
  title: string;
  location: string;
  experienceLevel: string;
  roleOverview: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  whatWeLookFor: string;
  rawText: string;
  active: boolean;
  createdAt: string;
}

export interface N8nExecutionRecord {
  triggeredAt: string;
  webhookUrl?: string;
  status: 'triggered' | 'delivered' | 'bypassed' | 'failed';
  responseStatus?: number;
  details?: string;
}

export interface Screening {
  id: string;
  candidateId: string;
  candidate: Candidate;
  jobId: string;
  jobTitle: string;
  status: ScreeningStatus;
  statusMessage?: string;
  error?: string | null;
  retryCount: number;
  result: StructuredScreeningResult | null;
  n8nExecution: N8nExecutionRecord | null;
  recruiterId: string;
  recruiterEmail: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Recruiter {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter';
  lastLoginAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  recruiterEmail: string;
  action: string;
  entityType: 'screening' | 'candidate' | 'job' | 'auth' | 'settings';
  entityId: string;
  details: string;
}

export interface SystemSettings {
  n8nWebhookUrl: string;
  n8nEnabled: boolean;
  geminiModel: string;
  companyName: string;
  defaultJobId: string;
}

export interface DashboardStats {
  totalScreenings: number;
  completedScreenings: number;
  failedScreenings: number;
  inProgressScreenings: number;
  strongHireCount: number;
  shortlistCount: number;
  considerCount: number;
  rejectCount: number;
  averageAtsScore: number;
  averageFitRating: number;
  recentScreenings: Screening[];
}
