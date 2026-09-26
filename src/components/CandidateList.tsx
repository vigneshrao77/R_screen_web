import React, { useState, useEffect } from 'react';
import { Screening, JobDescription } from '../types/index';
import { api } from '../services/api';
import { RecommendationBadge, ScoreBadge } from './RecommendationBadge';
import {
  Search,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { motion } from 'motion/react';

interface CandidateListProps {
  onSelectCandidate: (candidateId: string) => void;
  onNavigateToScreen: () => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  onSelectCandidate,
  onNavigateToScreen
}) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'atsScore' | 'fitRating' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    try {
      setError(null);
      const [screeningData, jobData] = await Promise.all([
        api.getScreenings(),
        api.getJobs()
      ]);
      setScreenings(screeningData);
      setJobs(jobData);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered & Sorted list
  const filtered = screenings.filter(s => {
    const name = s.candidate?.fullName?.toLowerCase() || '';
    const email = s.candidate?.email?.toLowerCase() || '';
    const skills = (s.result?.matched_skills || []).join(' ').toLowerCase();
    const summary = s.result?.candidate_summary?.toLowerCase() || '';
    const q = search.toLowerCase();

    if (q && !(name.includes(q) || email.includes(q) || skills.includes(q) || summary.includes(q))) {
      return false;
    }

    if (selectedJobId && s.jobId !== selectedJobId) {
      return false;
    }

    if (selectedRecommendation && s.result?.recommendation !== selectedRecommendation) {
      return false;
    }

    if (selectedRisk && s.result?.risk_assessment?.risk_score !== selectedRisk) {
      return false;
    }

    return true;
  });

  filtered.sort((a, b) => {
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

  const handleExportCsv = () => {
    if (filtered.length === 0) return;

    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'Role',
      'ATS Score',
      'Fit Rating (0-10)',
      'Recommendation',
      'Risk Score',
      'Reward Score',
      'Matched Skills',
      'Missing Skills',
      'Date Screened'
    ];

    const rows = filtered.map(s => [
      `"${s.candidate?.fullName || ''}"`,
      `"${s.candidate?.email || ''}"`,
      `"${s.candidate?.phone || ''}"`,
      `"${s.jobTitle || ''}"`,
      s.result?.ats_score || '',
      s.result?.overall_fit_rating || '',
      `"${s.result?.recommendation || ''}"`,
      `"${s.result?.risk_assessment?.risk_score || ''}"`,
      `"${s.result?.reward_assessment?.reward_score || ''}"`,
      `"${(s.result?.matched_skills || []).join(', ')}"`,
      `"${(s.result?.missing_skills || []).join(', ')}"`,
      `"${new Date(s.createdAt).toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Candidate_Screening_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectStyles: React.CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Candidates
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Filter and review candidate screening results.
          </p>
        </div>

        <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={filtered.length > 0 ? { scale: 1.03 } : {}}
            whileTap={filtered.length > 0 ? { scale: 0.96 } : {}}
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-40"
            style={{
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => { if (filtered.length > 0) e.currentTarget.style.background = 'var(--color-surface-subtle)' }}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
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
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {loading ? (
          <div className="p-4 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)]">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded-md bg-[var(--color-surface-hover)]"></div>
                  <div className="h-3 w-48 rounded-md bg-[var(--color-surface-hover)]"></div>
                </div>
                <div className="h-4 w-24 rounded-md bg-[var(--color-surface-hover)]"></div>
                <div className="h-6 w-16 rounded-md bg-[var(--color-surface-hover)]"></div>
                <div className="h-8 w-20 rounded-md bg-[var(--color-surface-hover)]"></div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Candidate</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                  <th className="py-2.5 px-4 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>ATS</th>
                  <th className="py-2.5 px-4 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Fit</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Result</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Risk / Reward</th>
                  <th className="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}></th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {filtered.map(s => {
                  const candidateName = s.candidate?.fullName || s.result?.candidate_name || 'Candidate';
                  const candidateEmail = s.candidate?.email || 'N/A';
                  const jobTitle = s.jobTitle || s.result?.job_title || 'AI Engineer';

                  return (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={{ opacity: 0, filter: 'blur(2px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, filter: 'blur(2px)' }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="transition-colors cursor-pointer group"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onClick={() => onSelectCandidate(s.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{candidateName}</div>
                        <div className="text-[12px] mt-0.5 opacity-80" style={{ color: 'var(--color-text-muted)' }}>{candidateEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {jobTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.result ? (
                          <span className="text-[13px] font-semibold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                            {s.result.ats_score}%
                          </span>
                        ) : (
                          <span className="text-[12px] opacity-40" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
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
                          <span className="text-[12px] opacity-40" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <RecommendationBadge recommendation={s.result?.recommendation} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ScoreBadge type="risk" score={s.result?.risk_assessment?.risk_score} />
                          <ScoreBadge type="reward" score={s.result?.reward_assessment?.reward_score} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(s.id);
                          }}
                          className="px-3 py-1.5 text-[12px] font-medium rounded-md transition-all opacity-0 group-hover:opacity-100"
                          style={{
                            background: 'var(--color-surface-subtle)',
                            color: 'var(--color-text-primary)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                        >
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-border-strong)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No candidates match your filters
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Try adjusting search terms or clearing filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
