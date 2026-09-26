import React, { useEffect, useState } from 'react';
import { DashboardStats, Screening } from '../types/index';
import { api } from '../services/api';
import { RecommendationBadge, ScoreBadge } from './RecommendationBadge';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onSelectCandidate: (candidateId: string) => void;
  onNavigateToScreen: () => void;
  onNavigateToCandidates: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectCandidate,
  onNavigateToScreen,
  onNavigateToCandidates
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-md bg-[var(--color-surface-hover)]"></div>
            <div className="h-4 w-72 rounded-md bg-[var(--color-surface-hover)]"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-md bg-[var(--color-surface-hover)]"></div>
            <div className="h-8 w-32 rounded-md bg-[var(--color-surface-hover)]"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"></div>
          ))}
        </div>
      </div>
    );
  }

  const total = stats?.totalScreenings || 0;
  const completed = stats?.completedScreenings || 0;
  const strongHire = stats?.strongHireCount || 0;
  const shortlist = stats?.shortlistCount || 0;
  const consider = stats?.considerCount || 0;
  const reject = stats?.rejectCount || 0;

  const qualifiedCount = strongHire + shortlist;
  const qualifiedRate = completed > 0 ? Math.round((qualifiedCount / completed) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Screening Overview
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Candidate pipeline powered by Gemini AI evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onNavigateToScreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-text)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Screen Resume</span>
          </motion.button>
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
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        <MetricCard
          label="Total Screened"
          value={total}
          icon={<Users className="w-4 h-4" />}
          footer={
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              <span>{completed} completed</span>
              <span>{stats?.inProgressScreenings || 0} in queue</span>
            </div>
          }
        />
        <MetricCard
          label="Qualified Rate"
          value={`${qualifiedRate}%`}
          icon={<CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
          footer={
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              <span>Strong Hire: {strongHire}</span>
              <span>Shortlist: {shortlist}</span>
            </div>
          }
        />
        <MetricCard
          label="Avg ATS Score"
          value={stats?.averageAtsScore || 0}
          valueSuffix="/100"
          icon={<Award className="w-4 h-4" style={{ color: 'var(--color-info)' }} />}
          footer={
            <div className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              Keyword &amp; skill alignment
            </div>
          }
        />
        <MetricCard
          label="Avg Overall Fit"
          value={stats?.averageFitRating || 0}
          valueSuffix="/10"
          icon={<TrendingUp className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />}
          footer={
            <div className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              AI evaluation scale
            </div>
          }
        />
      </motion.div>

      {/* Recommendation Distribution */}
      {completed > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Recommendation Distribution
            </h3>
            <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              {completed} screened
            </span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--color-surface-subtle)' }}>
            {strongHire > 0 && (
              <div
                style={{ width: `${(strongHire / completed) * 100}%`, background: 'var(--color-success)' }}
                title={`Strong Hire: ${strongHire}`}
              />
            )}
            {shortlist > 0 && (
              <div
                style={{ width: `${(shortlist / completed) * 100}%`, background: 'var(--color-info)' }}
                title={`Shortlist: ${shortlist}`}
              />
            )}
            {consider > 0 && (
              <div
                style={{ width: `${(consider / completed) * 100}%`, background: 'var(--color-warning)' }}
                title={`Consider: ${consider}`}
              />
            )}
            {reject > 0 && (
              <div
                style={{ width: `${(reject / completed) * 100}%`, background: 'var(--color-error)' }}
                title={`Reject: ${reject}`}
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
            <LegendItem color="var(--color-success)" label="Strong Hire" count={strongHire} />
            <LegendItem color="var(--color-info)" label="Shortlist" count={shortlist} />
            <LegendItem color="var(--color-warning)" label="Consider" count={consider} />
            <LegendItem color="var(--color-error)" label="Reject" count={reject} />
          </div>
        </div>
      )}

      {/* Recent Screenings Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Recent Screenings
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Candidates evaluated by Gemini AI
            </p>
          </div>

          <motion.button
            whileHover={{ x: 3 }}
            onClick={onNavigateToCandidates}
            className="inline-flex items-center gap-1 text-[13px] font-medium transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            <span>All candidates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {stats?.recentScreenings && stats.recentScreenings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-subtle)' }}>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Candidate</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-muted)' }}>ATS</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--color-text-muted)' }}>Fit</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Result</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Risk / Reward</th>
                  <th className="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentScreenings.map(s => {
                  const candidateName = s.candidate?.fullName || s.result?.candidate_name || 'Candidate';
                  const candidateEmail = s.candidate?.email || 'N/A';
                  const jobTitle = s.jobTitle || s.result?.job_title || 'AI Engineer';

                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="transition-colors cursor-pointer group"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onClick={() => onSelectCandidate(s.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="py-3 px-4">
                        <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{candidateName}</div>
                        <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{candidateEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {jobTitle}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.result ? (
                          <span className="text-[13px] font-semibold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                            {s.result.ats_score}%
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.result ? (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded-md text-[12px] font-semibold font-mono"
                            style={{
                              background: 'var(--color-surface-subtle)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {s.result.overall_fit_rating}/10
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <RecommendationBadge recommendation={s.result?.recommendation} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ScoreBadge type="risk" score={s.result?.risk_assessment?.risk_score} />
                          <ScoreBadge type="reward" score={s.result?.reward_assessment?.reward_score} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(s.id);
                          }}
                          className="px-2.5 py-1 text-[12px] font-medium rounded-md transition-all opacity-0 group-hover:opacity-100"
                          style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-secondary)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                        >
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-border-strong)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No resumes screened yet
            </p>
            <p className="text-[13px] mt-1 max-w-sm mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Upload candidate PDF resumes to begin AI-powered screening.
            </p>
            <button
              onClick={onNavigateToScreen}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-text)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Screen Your First Resume</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Helper Components ────────────────────────────────────────── */

const MetricCard: React.FC<{
  label: string;
  value: number | string;
  valueSuffix?: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
}> = ({ label, value, valueSuffix, icon, footer }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 28 } }
    }}
    whileHover={{ y: -4, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
    className="rounded-lg p-5"
    style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-xs)'
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
    </div>
    <div className="mb-3">
      <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
      {valueSuffix && (
        <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {valueSuffix}
        </span>
      )}
    </div>
    <div className="pt-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
      {footer}
    </div>
  </motion.div>
);

const LegendItem: React.FC<{ color: string; label: string; count: number }> = ({ color, label, count }) => (
  <div className="flex items-center gap-1.5 text-[12px]">
    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
    <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{count}</span>
  </div>
);
