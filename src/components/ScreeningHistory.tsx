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

  const getStatusBadge = (status: Screening['status']) => {
    const base = "inline-flex items-center px-2 py-[3px] rounded-md text-[11px] font-semibold";

    switch (status) {
      case 'completed':
        return (
          <span
            className={base}
            style={{
              background: 'var(--color-success-subtle)',
              color: '#15803d',
              border: '1px solid var(--color-success-border)',
            }}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
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
              border: '1px solid var(--color-error-border)',
            }}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
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
              background: 'var(--color-info-subtle)',
              color: '#1d4ed8',
              border: '1px solid var(--color-info-border)',
            }}
          >
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            {status === 'extracting' ? 'Extracting' : status === 'ai_evaluating' ? 'AI Evaluating' : 'Processing'}
          </span>
        );
      default:
        return (
          <span
            className={base}
            style={{
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
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

        <button
          onClick={fetchScreenings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors self-start sm:self-auto"
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
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
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Loading history…</span>
          </div>
        ) : screenings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-subtle)' }}>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>ID / Date</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Candidate</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Role</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Status</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Result</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Retries</th>
                  <th className="py-2.5 px-4 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {screenings.map(s => {
                  const candidateName = s.candidate?.fullName || s.result?.candidate_name || 'Candidate';
                  const candidateEmail = s.candidate?.email || 'N/A';
                  const isRetrying = retryingId === s.id;

                  return (
                    <tr
                      key={s.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-[12px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {s.id.slice(0, 14)}…
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{candidateName}</div>
                        <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{candidateEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {s.jobTitle || 'AI Engineer'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(s.status)}
                        {s.error && (
                          <div className="text-[11px] mt-1 max-w-xs truncate" style={{ color: 'var(--color-error)' }} title={s.error}>
                            {s.error}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.result ? (
                          <div className="space-y-1">
                            <RecommendationBadge recommendation={s.result.recommendation} size="sm" />
                            <div className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                              ATS: {s.result.ats_score}% · Fit: {s.result.overall_fit_rating}/10
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                        {s.retryCount > 0 ? (
                          <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>
                            {s.retryCount} {s.retryCount === 1 ? 'retry' : 'retries'}
                          </span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.status === 'completed' && (
                            <button
                              onClick={() => onSelectCandidate(s.id)}
                              className="px-2.5 py-1 text-[12px] font-medium rounded-md transition-colors"
                              style={{
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)',
                                color: 'var(--color-text-secondary)',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                            >
                              View
                            </button>
                          )}

                          <button
                            onClick={() => handleRetry(s.id)}
                            disabled={isRetrying}
                            className="px-2.5 py-1 text-[12px] font-medium rounded-md transition-colors disabled:opacity-50"
                            style={{
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-surface-subtle)',
                              color: 'var(--color-text-secondary)',
                            }}
                            onMouseEnter={(e) => { if (!isRetrying) e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-subtle)'}
                          >
                            {isRetrying ? (
                              <RefreshCw className="w-3 h-3 animate-spin inline mr-1" />
                            ) : (
                              <RotateCcw className="w-3 h-3 inline mr-1" />
                            )}
                            Retry
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
