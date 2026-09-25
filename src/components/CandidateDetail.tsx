import React, { useState, useEffect } from 'react';
import { Screening, JobDescription } from '../types/index';
import { api } from '../services/api';
import { RecommendationBadge, ScoreBadge } from './RecommendationBadge';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Building,
  ShieldAlert,
  Send,
  Trash2
} from 'lucide-react';

interface CandidateDetailProps {
  screeningId: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export const CandidateDetail: React.FC<CandidateDetailProps> = ({
  screeningId,
  onBack,
  onDeleted
}) => {
  const [screening, setScreening] = useState<(Screening & { job: JobDescription }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'skills' | 'questions' | 'workflow'>('assessment');

  const fetchDetail = async () => {
    try {
      setError(null);
      const data = await api.getScreening(screeningId);
      setScreening(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [screeningId]);

  const handleRetry = async () => {
    if (!screening) return;
    setRetrying(true);
    setError(null);
    try {
      const updated = await api.retryScreening(screening.id);
      await fetchDetail();
    } catch (err: any) {
      setError('Retry failed: ' + err.message);
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this candidate screening record?')) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteScreening(screeningId);
      if (onDeleted) onDeleted();
      else onBack();
    } catch (err: any) {
      setError('Failed to delete: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: 'var(--color-text-muted)' }}>
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading candidate details…</span>
      </div>
    );
  }

  if (!screening || !screening.candidate) {
    return (
      <div
        className="rounded-lg p-8 text-center space-y-4"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <AlertTriangle className="w-8 h-8 mx-auto" style={{ color: 'var(--color-warning)' }} />
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Record Not Found
        </h2>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          This screening record may have been deleted.
        </p>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
          }}
        >
          Back to Candidates
        </button>
      </div>
    );
  }

  const { candidate, result, job } = screening;
  const isFailed = screening.status === 'failed';
  const isCompleted = screening.status === 'completed';

  const tabItems = [
    { id: 'assessment' as const, label: 'Assessment' },
    { id: 'skills' as const, label: 'Skills & Experience' },
    { id: 'questions' as const, label: 'Interview Questions' },
    { id: 'workflow' as const, label: 'Workflow & Audit' },
  ];

  const btnSecondary: React.CSSProperties = {
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Candidates</span>
        </button>

        <div className="flex items-center gap-2">
          <a
            href={api.getResumeUrl(screening.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
            style={btnSecondary}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Resume</span>
          </a>

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-text)',
            }}
            onMouseEnter={(e) => { if (!retrying) e.currentTarget.style.background = 'var(--color-primary-hover)' }}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{isFailed ? 'Retry' : 'Re-screen'}</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete screening record"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-error)';
              e.currentTarget.style.background = 'var(--color-error-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: 'var(--color-error-subtle)',
            border: '1px solid var(--color-error-border)',
            color: 'var(--color-error)',
          }}
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div
        className="rounded-lg p-5"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {candidate.fullName}
              </h1>
              {result && <RecommendationBadge recommendation={result.recommendation} size="lg" />}
              {isFailed && (
                <span
                  className="px-2 py-0.5 text-[12px] font-semibold rounded-md"
                  style={{
                    background: 'var(--color-error-subtle)',
                    color: 'var(--color-error)',
                    border: '1px solid var(--color-error-border)',
                  }}
                >
                  Screening Failed
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              <div className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                <span>{job?.title || screening.jobTitle}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${candidate.email}`} className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(screening.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Score Cluster */}
          {result && (
            <div
              className="flex items-center gap-4 p-3 rounded-lg self-start"
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="text-center px-3" style={{ borderRight: '1px solid var(--color-border)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>ATS</div>
                <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {result.ats_score}
                  <span className="text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>/100</span>
                </div>
              </div>
              <div className="text-center px-3" style={{ borderRight: '1px solid var(--color-border)' }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Fit</div>
                <div className="text-xl font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  {result.overall_fit_rating}
                  <span className="text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>/10</span>
                </div>
              </div>
              <div className="px-2 space-y-1">
                <ScoreBadge type="risk" score={result.risk_assessment?.risk_score} />
                <ScoreBadge type="reward" score={result.reward_assessment?.reward_score} />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {result?.candidate_summary && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Summary
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {result.candidate_summary}
            </p>
          </div>
        )}

        {/* AI disclaimer */}
        {result && (
          <p className="mt-3 text-[11px] italic" style={{ color: 'var(--color-text-muted)' }}>
            AI-generated screening assistance. Review candidate information before making hiring decisions.
          </p>
        )}

        {isFailed && screening.error && (
          <div
            className="mt-4 p-3 rounded-lg text-[13px]"
            style={{
              background: 'var(--color-error-subtle)',
              border: '1px solid var(--color-error-border)',
              color: 'var(--color-error)',
            }}
          >
            <strong>Error:</strong> {screening.error}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {tabItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="pb-2.5 px-3 text-[13px] font-medium transition-colors whitespace-nowrap"
            style={{
              color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Assessment */}
      {activeTab === 'assessment' && result && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard
              icon={<ShieldAlert className="w-4 h-4" />}
              title="Hiring Risk"
              badge={<ScoreBadge type="risk" score={result.risk_assessment?.risk_score} />}
              label="Vulnerabilities"
              content={result.risk_assessment?.reason || 'No specific risks identified.'}
            />
            <SectionCard
              icon={<Award className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              title="Business Reward"
              badge={<ScoreBadge type="reward" score={result.reward_assessment?.reward_score} />}
              label="Potential Value"
              content={result.reward_assessment?.reason || 'No specific upside detailed.'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard
              icon={<CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              title="Strengths"
              items={result.strengths}
              bulletColor="var(--color-success)"
              emptyText="No explicit strengths listed."
            />
            <ListCard
              icon={<XCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />}
              title="Weaknesses & Gaps"
              items={result.weaknesses}
              bulletColor="var(--color-error)"
              emptyText="No significant weaknesses flagged."
            />
          </div>

          <div
            className="rounded-lg p-5"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Justification
            </h3>
            <p
              className="text-[13px] leading-relaxed whitespace-pre-line p-3 rounded-md"
              style={{
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {result.justification}
            </p>
          </div>
        </div>
      )}

      {/* TAB: Skills */}
      {activeTab === 'skills' && result && (
        <div className="space-y-5">
          <div
            className="rounded-lg p-5 space-y-5"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <SkillSection
              icon={<CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              title="Matched Skills"
              count={result.matched_skills?.length || 0}
              countLabel="Skills"
              countColor="var(--color-success)"
              skills={result.matched_skills}
              skillStyle={{
                background: 'var(--color-success-subtle)',
                color: '#15803d',
                border: '1px solid var(--color-success-border)',
              }}
              prefix="✓"
              emptyText="No overlapping skills found."
            />

            <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

            <SkillSection
              icon={<XCircle className="w-4 h-4" style={{ color: 'var(--color-error)' }} />}
              title="Missing Skills"
              count={result.missing_skills?.length || 0}
              countLabel="Gaps"
              countColor="var(--color-error)"
              skills={result.missing_skills}
              skillStyle={{
                background: 'var(--color-error-subtle)',
                color: '#991b1b',
                border: '1px solid var(--color-error-border)',
              }}
              prefix="✕"
              emptyText="Candidate possesses all required skills."
              emptyColor="var(--color-success)"
            />

            <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

            <SkillSection
              icon={<Award className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              title="Additional Skills"
              count={result.additional_skills?.length || 0}
              countLabel="Skills"
              skills={result.additional_skills}
              skillStyle={{
                background: 'var(--color-surface-subtle)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
              prefix="+"
              emptyText="No additional skills noted."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextCard title="Experience Alignment" content={result.experience_match || 'No experience details available.'} />
            <TextCard title="Education Alignment" content={result.education_match || 'No education match details available.'} />
          </div>
        </div>
      )}

      {/* TAB: Interview Questions */}
      {activeTab === 'questions' && result && (
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              AI-Generated Interview Questions
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Targeted questions to validate qualifications and probe skill gaps.
            </p>
          </div>

          <div className="space-y-2">
            {result.interview_questions && result.interview_questions.length > 0 ? (
              result.interview_questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md flex items-start gap-3"
                  style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-primary-text)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-[13px] font-medium leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {q}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
                No interview questions generated.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB: Workflow & Audit */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <div
            className="rounded-lg p-5 space-y-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              n8n Workflow Execution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoCard label="Status" value={screening.n8nExecution?.status || 'Active Integration'} />
              <InfoCard
                label="Triggered"
                value={
                  screening.n8nExecution?.triggeredAt
                    ? new Date(screening.n8nExecution.triggeredAt).toLocaleTimeString()
                    : 'N/A'
                }
              />
              <InfoCard label="AI Model" value="Gemini 3.8 Flash" />
            </div>

            {screening.n8nExecution?.details && (
              <div
                className="p-3 rounded-md text-[12px]"
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--color-text-primary)' }}>Workflow log: </strong>
                {screening.n8nExecution.details}
              </div>
            )}

            <div
              className="p-3 rounded-md text-[12px] space-y-1.5"
              style={{
                background: 'var(--color-info-subtle)',
                border: '1px solid var(--color-info-border)',
                color: '#1e40af',
              }}
            >
              <div className="font-semibold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>External Pipeline Steps:</span>
              </div>
              <p>
                • <strong>Gmail:</strong> Applicant acknowledgment sent to <code className="text-[11px]">{candidate.email}</code>.
              </p>
              <p>
                • <strong>Notion:</strong> Candidate row synced to database <code className="text-[11px]">39d18f57-…</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helper Components ────────────────────────────────────────── */

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge: React.ReactNode;
  label: string;
  content: string;
}> = ({ icon, title, badge, label, content }) => (
  <div
    className="rounded-lg p-5"
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}
  >
    <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      </div>
      {badge}
    </div>
    <div className="mt-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <p
        className="text-[13px] leading-relaxed p-3 rounded-md"
        style={{
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {content}
      </p>
    </div>
  </div>
);

const ListCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  items?: string[];
  bulletColor: string;
  emptyText: string;
}> = ({ icon, title, items, bulletColor, emptyText }) => (
  <div
    className="rounded-lg p-5"
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}
  >
    <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      {icon}
      <h3 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    </div>
    <ul className="mt-3 space-y-1.5 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
      {items && items.length > 0 ? (
        items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="font-bold mt-0.5" style={{ color: bulletColor }}>•</span>
            <span>{item}</span>
          </li>
        ))
      ) : (
        <li style={{ color: 'var(--color-text-muted)' }}>{emptyText}</li>
      )}
    </ul>
  </div>
);

const SkillSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  count: number;
  countLabel: string;
  countColor?: string;
  skills?: string[];
  skillStyle: React.CSSProperties;
  prefix: string;
  emptyText: string;
  emptyColor?: string;
}> = ({ icon, title, count, countLabel, countColor, skills, skillStyle, prefix, emptyText, emptyColor }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {icon}
        <span>{title}</span>
      </span>
      <span
        className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
        style={{
          background: 'var(--color-surface-subtle)',
          color: countColor || 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        {count} {countLabel}
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {skills && skills.length > 0 ? (
        skills.map((skill, i) => (
          <span key={i} className="px-2 py-1 text-[12px] font-medium rounded-md" style={skillStyle}>
            {prefix} {skill}
          </span>
        ))
      ) : (
        <span className="text-[12px]" style={{ color: emptyColor || 'var(--color-text-muted)' }}>
          {emptyText}
        </span>
      )}
    </div>
  </div>
);

const TextCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div
    className="rounded-lg p-5"
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}
  >
    <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
      {title}
    </h3>
    <p
      className="text-[13px] leading-relaxed p-3 rounded-md"
      style={{
        background: 'var(--color-surface-subtle)',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {content}
    </p>
  </div>
);

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="p-3 rounded-md"
    style={{
      background: 'var(--color-surface-subtle)',
      border: '1px solid var(--color-border-subtle)',
    }}
  >
    <span className="text-[11px] font-semibold uppercase tracking-wider block mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </span>
    <span className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
);
