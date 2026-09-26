import React, { useState, useEffect } from 'react';
import { Screening } from '../types/index';
import { api } from '../services/api';
import { RecommendationBadge } from './RecommendationBadge';
import {
  History,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScreeningHistoryProps {
  onSelectCandidate: (candidateId: string) => void;
}

export const ScreeningHistory: React.FC<ScreeningHistoryProps> = ({
  onSelectCandidate
}) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScreenings = async () => {
    try {
      setError(null);
      const data = await api.getScreenings();
      setScreenings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load screening history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const handleRetry = async (screeningId: string) => {
    setRetryingId(screeningId);
    try {
      await api.retryScreening(screeningId);
      await fetchScreenings();
    } catch (err: any) {
      alert('Retry error: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const getUserFriendlyError = (error: string | undefined | null) => {
    if (!error) return null;
    
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('credentials') || lowerError.includes('authentication') || lowerError.includes('api key')) {
      return 'Authentication failed. Please verify your integration settings.';
    }
    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return 'The request took too long. Please try again.';
    }
    if (lowerError.includes('rate limit') || lowerError.includes('429')) {
      return 'Service is currently busy. Please try again later.';
    }
    if (lowerError.includes('gemini') || lowerError.includes('ai eval') || lowerError.includes('llm')) {
      return 'AI evaluation encountered an issue.';
    }
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('failed to fetch')) {
      return 'Network connection issue. Please check your internet.';
    }
    
    if (error.length > 60 || error.includes('http') || error.includes('://')) {
      return 'An unexpected error occurred during processing.';
    }
    
    return error;
  };

  const getStatusBadge = (status: Screening['status']) => {
    const base = "inline-flex items-center px-2 py-1 rounded-[4px] text-[11px] font-medium";

    switch (status) {
      case 'completed':
        return (
          <span
            className={base}
            style={{
              background: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
            }}
          >
            <CheckCircle2 className="w-3 h-3 mr-1.5 opacity-70" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span
            className={base}
            style={{
              background: 'var(--color-error-subtle)',
              color: 'var(--color-error)',
            }}
          >
            <AlertCircle className="w-3 h-3 mr-1.5 opacity-70" />
            Failed
          </span>
        );
      case 'extracting':
      case 'n8n_triggered':
      case 'ai_evaluating':
      case 'pending':
        return (
          <span
            className={base}
            style={{
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
            }}
          >
            <RefreshCw className="w-3 h-3 mr-1.5 animate-spin opacity-70" />
            {status === 'extracting' ? 'Extracting' : status === 'ai_evaluating' ? 'Evaluating' : 'Processing'}
          </span>
        );
      default:
        return (
          <span
            className={base}
            style={{
              background: 'transparent',
              color: 'var(--color-text-secondary)',
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Screening History
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Processing status of all resume screening jobs.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchScreenings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors self-start sm:self-auto"
          style={{
            background: 'transparent',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-surface-subtle)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 opacity-70" />
          <span>Refresh List</span>
        </motion.button>
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

      {/* Table */}
      <div className="-mx-4 sm:mx-0 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className="w-4 h-4 animate-spin mr-2 opacity-50" />
            <span className="text-[13px]">Loading history…</span>
          </div>
        ) : screenings.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Date & ID</th>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Candidate</th>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Evaluation</th>
                <th className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Retries</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.04 }
                }
              }}
            >
                {screenings.map(s => {
                  const candidateName = s.candidate?.fullName || s.result?.candidate_name || 'Candidate';
                  const candidateEmail = s.candidate?.email || 'N/A';
                  const isRetrying = retryingId === s.id;

                  return (
                    <motion.tr
                      key={s.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(s.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="font-mono text-[10px] mt-1 opacity-60" style={{ color: 'var(--color-text-muted)' }}>
                          {s.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{candidateName}</div>
                        <div className="text-[11.5px] mt-0.5 opacity-80" style={{ color: 'var(--color-text-muted)' }}>{candidateEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[13px] align-top" style={{ color: 'var(--color-text-secondary)' }}>
                        {s.jobTitle || 'AI Engineer'}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        {getStatusBadge(s.status)}
                        {s.error && (
                          <div className="text-[11px] mt-1.5 max-w-[180px] leading-snug opacity-90" style={{ color: 'var(--color-error)' }}>
                            {getUserFriendlyError(s.error)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        {s.result ? (
                          <div className="space-y-1">
                            <RecommendationBadge recommendation={s.result.recommendation} size="sm" />
                            <div className="text-[11px] font-mono mt-1 opacity-80" style={{ color: 'var(--color-text-muted)' }}>
                              ATS {s.result.ats_score}% <span className="mx-1 opacity-40">|</span> Fit {s.result.overall_fit_rating}/10
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px] opacity-40" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] align-top">
                        {s.retryCount > 0 ? (
                          <span className="font-medium" style={{ color: 'var(--color-warning)' }}>
                            {s.retryCount}
                          </span>
                        ) : (
                          <span className="opacity-30" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {s.status === 'completed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onSelectCandidate(s.id)}
                              className="px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors"
                              style={{
                                background: 'var(--color-surface-subtle)',
                                color: 'var(--color-text-primary)',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                            >
                              View
                            </motion.button>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRetry(s.id)}
                            disabled={isRetrying}
                            className="px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors disabled:opacity-50"
                            style={{
                              background: 'transparent',
                              color: 'var(--color-text-secondary)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isRetrying) {
                                e.currentTarget.style.background = 'var(--color-surface-subtle)';
                                e.currentTarget.style.color = 'var(--color-text-primary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--color-text-secondary)';
                            }}
                          >
                            {isRetrying ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
        ) : (
          <div className="py-12 text-center">
            <History className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-border-strong)' }} />
            <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              No screening history yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
